/**
 * ═══════════════════════════════════════════════════════════
 * LOAN & ADVANCE RECOVERY ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * LOAN RECOVERY:
 *   Outstanding Loan - Monthly EMI
 *   Track: Total Loan, Recovered Amount, Pending Amount, Recovery Schedule
 * 
 * ADVANCE RECOVERY:
 *   Advance Amount - Configured Recovery
 */

export class LoanRecoveryEngine {
  constructor(roundingEngine, logger) {
    this.roundingEngine = roundingEngine;
    this.logger = logger;
  }

  /**
   * Calculate loan recovery for the month
   * 
   * @param {Array} activeLoans - From ConfigLoader.loadActiveLoans()
   * @returns {object} Loan recovery breakdown
   */
  calculate(activeLoans, month, year) {
    if (this.logger) this.logger.startStep(12, 'CALCULATE_LOAN_RECOVERY');

    const result = {
      loans: [],
      totalLoanRecovery: 0,
      totalAdvanceRecovery: 0,
      totalRecovery: 0,
    };

    if (!activeLoans || activeLoans.length === 0) {
      if (this.logger) {
        this.logger.log(12, 'CALCULATE_LOAN_RECOVERY', 'LOAN',
          'No active loans', {}, 0, result);
      }
      return result;
    }

    for (const loan of activeLoans) {
      const loanData = loan.loanData && typeof loan.loanData === 'object' ? loan.loanData : {};
      
      let emi = 0;
      if (Array.isArray(loanData.repaymentSchedule) && loanData.repaymentSchedule.length > 0) {
        if (month !== undefined && year !== undefined) {
          const matchingInstallment = loanData.repaymentSchedule.find(item => {
            if (!item.dueDate) return false;
            const date = new Date(item.dueDate);
            return (date.getMonth() + 1 === Number(month)) && (date.getFullYear() === Number(year));
          });
          emi = matchingInstallment ? Number(matchingInstallment.amount || 0) : 0;
        } else {
          const pendingItem = loanData.repaymentSchedule.find(item => item.status === 'Pending') || loanData.repaymentSchedule[0];
          emi = Number(pendingItem?.amount || 0);
        }
      } else {
        emi = Number(loan.emi || loanData.emi || loanData.emiAmount || 0);
        if (emi <= 0) {
          const installments = Number(loanData.installments || 1);
          const amount = Number(loan.amount || loanData.amount || 0);
          emi = Math.round(amount / installments);
        }
      }

      const totalAmount = Number(loan.amount || loanData.principalAmount || loanData.amount || 0);
      const recoveredAmount = Number(loanData.recoveredAmount || loanData.totalRepaid || 0);
      const pendingAmount = totalAmount - recoveredAmount;
      const loanType = loanData.loanType || loanData.type || 'LOAN';

      if (emi <= 0) continue;

      // Don't recover more than pending
      const recoveryAmount = this.roundingEngine.salary(Math.min(emi, Math.max(0, pendingAmount)));

      const loanEntry = {
        loanId: loan.id,
        loanType,
        totalLoan: totalAmount,
        emi,
        recoveredSoFar: recoveredAmount,
        pendingAmount,
        recoveryThisMonth: recoveryAmount,
      };

      result.loans.push(loanEntry);

      if (loanType === 'ADVANCE' || loanType === 'SALARY_ADVANCE') {
        result.totalAdvanceRecovery += recoveryAmount;
      } else {
        result.totalLoanRecovery += recoveryAmount;
      }
    }

    result.totalRecovery = result.totalLoanRecovery + result.totalAdvanceRecovery;

    if (this.logger) {
      this.logger.log(12, 'CALCULATE_LOAN_RECOVERY', 'LOAN',
        `${result.loans.length} active loan(s), total recovery = ₹${result.totalRecovery}`,
        { loanCount: activeLoans.length },
        result.totalRecovery,
        result
      );
    }

    return result;
  }
}
