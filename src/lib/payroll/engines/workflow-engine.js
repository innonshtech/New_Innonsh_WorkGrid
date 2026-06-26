/**
 * ═══════════════════════════════════════════════════════════
 * WORKFLOW ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * Handles multi-level approvals for payroll actions:
 *   - Payroll Run
 *   - Loans & Advances
 *   - Reimbursements
 *   - Tax Declarations
 *   - Full & Final Settlement
 * 
 * Supports role-based routing (HR, FINANCE, ADMIN) and 
 * relationship-based routing (MANAGER - direct reporting manager).
 */

import prisma from '@/lib/db/prisma';

export class WorkflowEngine {
  constructor() {
    // Default configs if none exist in the database
    this.defaultConfigs = {
      PAYROLL_RUN: [
        { level: 1, role: 'HR', autoApproveDays: 5 },
        { level: 2, role: 'FINANCE', autoApproveDays: 5 },
        { level: 3, role: 'ADMIN', autoApproveDays: 3 }
      ],
      LOAN: [
        { level: 1, role: 'MANAGER', autoApproveDays: 3 },
        { level: 2, role: 'HR', autoApproveDays: 3 },
        { level: 3, role: 'FINANCE', autoApproveDays: 3 }
      ],
      REIMBURSEMENT: [
        { level: 1, role: 'MANAGER', autoApproveDays: 3 },
        { level: 2, role: 'HR', autoApproveDays: 3 }
      ],
      TAX_DECLARATION: [
        { level: 1, role: 'HR', autoApproveDays: 7 }
      ],
      FNF: [
        { level: 1, role: 'HR', autoApproveDays: 5 },
        { level: 2, role: 'FINANCE', autoApproveDays: 5 }
      ]
    };
  }

  /**
   * Resolve specific user ID for a role or manager
   */
  async _resolveStepAssignee(orgId, role, initiatorId) {
    if (role === 'MANAGER') {
      // Find the initiator's employee record to get their manager
      const employee = await prisma.employee.findUnique({
        where: { id: initiatorId },
      });
      if (employee && employee.reportingManager) {
        // reportingManager contains manager's name/code or ID. 
        // Let's find the user account for the reporting manager
        const managerUser = await prisma.user.findFirst({
          where: {
            OR: [
              { employeeId: employee.reportingManager },
              { id: employee.reportingManager },
              { email: employee.reportingManager }
            ],
            organizationId: orgId,
          }
        });
        return managerUser ? managerUser.id : null;
      }
      // Fallback: if no manager found, route to HR
      role = 'HR';
    }

    // Role-based routing doesn't assign to a specific user initially;
    // any user with that role in the organization can claim it or approve it.
    return null;
  }

  /**
   * Initiate approval workflow for a given entity
   */
  async initiateWorkflow({ organizationId, workflowType, entityType, entityId, initiatedById }) {
    // 1. Get workflow configuration
    let config = await prisma.payrollWorkflowConfig.findFirst({
      where: {
        organizationId,
        workflowType,
        status: 'ACTIVE'
      }
    });

    let levels = config ? config.approvalLevels : this.defaultConfigs[workflowType];
    if (!levels || levels.length === 0) {
      levels = this.defaultConfigs[workflowType] || [{ level: 1, role: 'ADMIN', autoApproveDays: 3 }];
    }

    // If config doesn't exist, create a default one
    if (!config) {
      config = await prisma.payrollWorkflowConfig.create({
        data: {
          organizationId,
          workflowType,
          approvalLevels: levels,
          status: 'ACTIVE',
        }
      });
    }

    // 2. Create workflow instance
    const instance = await prisma.payrollWorkflowInstance.create({
      data: {
        workflowConfigId: config.id,
        entityType,
        entityId,
        currentLevel: 1,
        currentStatus: 'PENDING',
        initiatedById,
      }
    });

    // 3. Create the first step
    const firstLevelConfig = levels.find(l => l.level === 1) || levels[0];
    const assignedToId = await this._resolveStepAssignee(organizationId, firstLevelConfig.role, initiatedById);

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + (firstLevelConfig.autoApproveDays || 3));

    const step = await prisma.payrollWorkflowStep.create({
      data: {
        instanceId: instance.id,
        level: 1,
        assignedToRole: firstLevelConfig.role,
        assignedToId,
        action: 'PENDING',
        autoApproveDeadline: deadline,
      }
    });

    // 4. Create Notification
    await this._createNotification({
      recipientId: assignedToId || 'ROLE:' + firstLevelConfig.role,
      recipientRole: assignedToId ? null : firstLevelConfig.role,
      type: 'APPROVAL_REQUEST',
      title: `Approval Required: ${entityType}`,
      message: `A new ${entityType.toLowerCase()} requires your approval.`,
      entityType,
      entityId,
    });

    // 5. Update underlying entity status to PENDING / SUBMITTED
    await this._updateEntityStatus(entityType, entityId, 'PENDING_APPROVAL', { level: 1, role: firstLevelConfig.role });

    return { instance, step };
  }

  /**
   * Process approval or rejection action on a workflow step
   */
  async processWorkflowAction({ instanceId, stepId, action, comments, userId, userRole }) {
    const step = await prisma.payrollWorkflowStep.findUnique({
      where: { id: stepId },
      include: { instance: { include: { config: true } } }
    });

    if (!step || step.action !== 'PENDING') {
      throw new Error('Workflow step not found or already processed');
    }

    const instance = step.instance;

    // Verify permission (either assigned directly to user or matches user role)
    if (step.assignedToId && step.assignedToId !== userId) {
      throw new Error('This workflow step is assigned to a different user');
    }
    if (!step.assignedToId && step.assignedToRole.toUpperCase() !== userRole.toUpperCase() && userRole.toUpperCase() !== 'ADMIN') {
      throw new Error(`This step requires the ${step.assignedToRole} role`);
    }

    // Update current step
    const updatedStep = await prisma.payrollWorkflowStep.update({
      where: { id: stepId },
      data: {
        action,
        comments,
        actionAt: new Date(),
        assignedToId: userId, // Record who actually did it
      }
    });

    const levels = instance.config.approvalLevels;
    const nextLevelNum = step.level + 1;
    const nextLevelConfig = levels.find(l => l.level === nextLevelNum);

    if (action === 'REJECTED') {
      // Short-circuit: workflow rejected
      await prisma.payrollWorkflowInstance.update({
        where: { id: instance.id },
        data: {
          currentStatus: 'REJECTED',
          completedAt: new Date(),
        }
      });

      await this._updateEntityStatus(instance.entityType, instance.entityId, 'REJECTED', { comments, processedBy: userId });

      // Notify initiator
      await this._createNotification({
        recipientId: instance.initiatedById,
        type: 'REJECTED',
        title: `${instance.entityType} Rejected`,
        message: `Your request for ${instance.entityType.toLowerCase()} has been rejected: "${comments || ''}"`,
        entityType: instance.entityType,
        entityId: instance.entityId,
      });

      return { instanceStatus: 'REJECTED', currentStep: updatedStep };
    }

    if (action === 'APPROVED') {
      if (nextLevelConfig) {
        // Move to next approval level
        await prisma.payrollWorkflowInstance.update({
          where: { id: instance.id },
          data: { currentLevel: nextLevelNum }
        });

        const assignedToId = await this._resolveStepAssignee(instance.config.organizationId, nextLevelConfig.role, instance.initiatedById);
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + (nextLevelConfig.autoApproveDays || 3));

        const nextStep = await prisma.payrollWorkflowStep.create({
          data: {
            instanceId: instance.id,
            level: nextLevelNum,
            assignedToRole: nextLevelConfig.role,
            assignedToId,
            action: 'PENDING',
            autoApproveDeadline: deadline,
          }
        });

        await this._updateEntityStatus(instance.entityType, instance.entityId, 'PENDING_APPROVAL', { level: nextLevelNum, role: nextLevelConfig.role });

        // Notify next approver
        await this._createNotification({
          recipientId: assignedToId || 'ROLE:' + nextLevelConfig.role,
          recipientRole: assignedToId ? null : nextLevelConfig.role,
          type: 'APPROVAL_REQUEST',
          title: `Approval Required (Level ${nextLevelNum}): ${instance.entityType}`,
          message: `A ${instance.entityType.toLowerCase()} requires your approval.`,
          entityType: instance.entityType,
          entityId: instance.entityId,
        });

        return { instanceStatus: 'IN_PROGRESS', currentStep: nextStep };
      } else {
        // All levels approved
        await prisma.payrollWorkflowInstance.update({
          where: { id: instance.id },
          data: {
            currentStatus: 'APPROVED',
            completedAt: new Date(),
          }
        });

        await this._updateEntityStatus(instance.entityType, instance.entityId, 'APPROVED', { processedBy: userId });

        // Notify initiator
        await this._createNotification({
          recipientId: instance.initiatedById,
          type: 'APPROVED',
          title: `${instance.entityType} Approved`,
          message: `Your request for ${instance.entityType.toLowerCase()} has been fully approved.`,
          entityType: instance.entityType,
          entityId: instance.entityId,
        });

        return { instanceStatus: 'APPROVED', currentStep: updatedStep };
      }
    }

    return { instanceStatus: 'UNKNOWN', currentStep: updatedStep };
  }

  /**
   * Helper to retrieve pending approvals for a user
   */
  async getMyPendingApprovals(userId, role, organizationId) {
    const steps = await prisma.payrollWorkflowStep.findMany({
      where: {
        action: 'PENDING',
        OR: [
          { assignedToId: userId },
          {
            assignedToId: null,
            assignedToRole: role.toUpperCase(),
            instance: {
              config: {
                organizationId
              }
            }
          }
        ]
      },
      include: {
        instance: {
          include: {
            config: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add extra details about the target entity if needed
    const detailedSteps = [];
    for (const step of steps) {
      const entity = await this._loadEntityDetails(step.instance.entityType, step.instance.entityId);
      detailedSteps.push({
        ...step,
        entityDetails: entity
      });
    }

    return detailedSteps;
  }

  /**
   * Dynamic updater for entity states
   */
  async _updateEntityStatus(entityType, entityId, status, details = {}) {
    try {
      if (entityType === 'PAYROLL_RUN') {
        const runStatusMap = {
          'PENDING_APPROVAL': details.role === 'FINANCE' ? 'FINANCE_APPROVAL' : details.role === 'HR' ? 'HR_APPROVAL' : 'MANAGER_APPROVAL',
          'APPROVED': 'LOCKED',
          'REJECTED': 'OPEN'
        };
        await prisma.payrollRunV2.update({
          where: { id: entityId },
          data: {
            status: runStatusMap[status] || 'OPEN',
            errorLog: status === 'REJECTED' ? { rejectionComments: details.comments } : undefined
          }
        });
      } else if (entityType === 'LOAN') {
        const loanStatusMap = {
          'PENDING_APPROVAL': details.role === 'FINANCE' ? 'FinanceApproved' : details.role === 'HR' ? 'HRApproved' : 'ManagerApproved',
          'APPROVED': 'Approved',
          'REJECTED': 'Rejected'
        };
        const mappedStatus = loanStatusMap[status] || 'Applied';
        
        if (status === 'APPROVED') {
          const loan = await prisma.loan.findUnique({ where: { id: entityId } });
          if (loan) {
            const loanData = loan.loanData && typeof loan.loanData === 'object' ? loan.loanData : {};
            loanData.status = 'Approved';
            loanData.approvalDate = new Date().toISOString();
            
            const installments = Number(loanData.installments || 1);
            const amount = loan.amount || loanData.amount || 0;
            const installmentAmount = Math.round(amount / installments);
            
            if (!loanData.repaymentSchedule || loanData.repaymentSchedule.length === 0) {
              const schedule = [];
              const startDate = new Date();
              for (let i = 1; i <= installments; i++) {
                const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 10);
                schedule.push({
                  dueDate: dueDate.toISOString(),
                  amount: i === installments ? (amount - (installmentAmount * (i - 1))) : installmentAmount,
                  status: "Pending"
                });
              }
              loanData.repaymentSchedule = schedule;
            }
            
            await prisma.loan.update({
              where: { id: entityId },
              data: {
                status: 'Approved',
                emi: installmentAmount,
                loanData
              }
            });
          }
        } else {
          await prisma.loan.update({
            where: { id: entityId },
            data: {
              status: mappedStatus
            }
          });
        }
      } else if (entityType === 'REIMBURSEMENT') {
        await prisma.payrollReimbursement.update({
          where: { id: entityId },
          data: {
            status: status === 'APPROVED' ? 'Approved' : status === 'REJECTED' ? 'Rejected' : 'Submitted'
          }
        });
      } else if (entityType === 'TAX_DECLARATION') {
        await prisma.payrollTaxDeclaration.update({
          where: { id: entityId },
          data: {
            status: status === 'APPROVED' ? 'Verified' : status === 'REJECTED' ? 'Draft' : 'Submitted'
          }
        });
      } else if (entityType === 'FNF') {
        await prisma.payrollFnFProcess.update({
          where: { id: entityId },
          data: {
            status: status === 'APPROVED' ? 'Approved' : status === 'REJECTED' ? 'Initiated' : 'PendingHR'
          }
        });
      }
    } catch (err) {
      console.error(`Failed to update status for ${entityType} ID: ${entityId}`, err);
    }
  }

  /**
   * Load metadata / details of target entity for UI display
   */
  async _loadEntityDetails(entityType, entityId) {
    try {
      if (entityType === 'PAYROLL_RUN') {
        return prisma.payrollRunV2.findUnique({ where: { id: entityId } });
      } else if (entityType === 'LOAN') {
        return prisma.loan.findUnique({
          where: { id: entityId },
          include: { employee: true }
        });
      } else if (entityType === 'REIMBURSEMENT') {
        return prisma.payrollReimbursement.findUnique({
          where: { id: entityId },
          include: { employee: true }
        });
      } else if (entityType === 'TAX_DECLARATION') {
        return prisma.payrollTaxDeclaration.findUnique({
          where: { id: entityId },
          include: { employee: true }
        });
      } else if (entityType === 'FNF') {
        return prisma.payrollFnFProcess.findUnique({
          where: { id: entityId },
          include: { employee: true }
        });
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  /**
   * Helper to create Notifications
   */
  async _createNotification({ recipientId, recipientRole, type, title, message, entityType, entityId }) {
    try {
      // In-app notifications
      if (recipientId && !recipientId.startsWith('ROLE:')) {
        await prisma.payrollNotification.create({
          data: {
            recipientId,
            type,
            title,
            message,
            entityType,
            entityId,
          }
        });
      } else {
        // Resolve users with that role
        const roleUsers = await prisma.user.findMany({
          where: { role: (recipientRole || recipientId.replace('ROLE:', '')).toLowerCase() }
        });

        for (const u of roleUsers) {
          await prisma.payrollNotification.create({
            data: {
              recipientId: u.id,
              type,
              title,
              message,
              entityType,
              entityId,
            }
          });
        }
      }
    } catch (e) {
      console.error('Failed to create notification', e);
    }
  }

  /**
   * Cron support: Auto-approves pending steps after deadline has passed
   */
  async checkAutoApprovals() {
    const pendingSteps = await prisma.payrollWorkflowStep.findMany({
      where: {
        action: 'PENDING',
        autoApproveDeadline: { lte: new Date() }
      },
      include: {
        instance: true
      }
    });

    const results = [];
    for (const step of pendingSteps) {
      try {
        const res = await this.processWorkflowAction({
          instanceId: step.instanceId,
          stepId: step.id,
          action: 'APPROVED',
          comments: 'System Auto-Approved after deadline',
          userId: 'SYSTEM',
          userRole: step.assignedToRole
        });
        results.push({ stepId: step.id, status: 'AUTO_APPROVED', details: res });
      } catch (err) {
        results.push({ stepId: step.id, status: 'ERROR', error: err.message });
      }
    }
    return results;
  }
}
