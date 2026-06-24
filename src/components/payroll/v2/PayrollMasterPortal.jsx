"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Settings2, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  CheckSquare, 
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';

// Tab imports
import PayrollDashboard from './tabs/PayrollDashboard';
import PayrollRunWizard from './tabs/PayrollRunWizard';
import SalaryStructures from './tabs/SalaryStructures';
import PayrollQueryDesk from './tabs/PayrollQueryDesk';
import PayrollApprovals from './tabs/PayrollApprovals';
import PayrollConfig from './tabs/PayrollConfig';
import PayrollReports from './tabs/PayrollReports';

// A robust helper for fetching JSON api routes that catches non-JSON answers (like 404 HTML templates)
const safeFetchJson = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!res.ok) {
      if (isJson) {
        const errJson = await res.json();
        throw new Error(errJson.error || errJson.message || `HTTP Error ${res.status}`);
      }

      if (res.status === 404) {
        throw new Error(`The endpoint ${url} was not found (404). Please restart your development server (npm run dev) to refresh routes.`);
      }

      const text = await res.text();
      let errMessage = `HTTP Error ${res.status}`;
      if (text && text.includes('<!DOCTYPE html>')) {
        errMessage = `Server returned HTML page instead of JSON. The route might be unauthorized or not registered. Try restarting your dev server.`;
      } else if (text) {
        errMessage = text.slice(0, 150);
      }
      throw new Error(errMessage);
    }
    
    if (!isJson) {
      const text = await res.text();
      if (text.includes('<!DOCTYPE html>')) {
        throw new Error("Server returned HTML page instead of JSON. Try restarting your dev server to refresh Next.js routes.");
      }
      throw new Error("Server returned non-JSON response");
    }
    return await res.json();
  } catch (error) {
    throw error;
  }
};

export default function PayrollMasterPortal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(tabParam);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Dashboard & Workflow Stats
  const [runs, setRuns] = useState([]);
  const [activeRun, setActiveRun] = useState(null);
  const [runEmployees, setRunEmployees] = useState([]);
  const [loadingRun, setLoadingRun] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Queries (Two-Way Communication)
  const [queries, setQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [queryFilter, setQueryFilter] = useState('ALL');
  const [replyLoading, setReplyLoading] = useState(false);

  // Approvals
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [decisionComments, setDecisionComments] = useState({});

  // Configs
  const [workflowConfigs, setWorkflowConfigs] = useState([]);
  const [masterComponents, setMasterComponents] = useState([]);
  const [salaryTemplates, setSalaryTemplates] = useState([]);
  const [configSubTab, setConfigSubTab] = useState('components');
  const [editingComponent, setEditingComponent] = useState(null);
  const [componentForm, setComponentForm] = useState({
    code: '',
    name: '',
    category: 'EARNING',
    formulaType: 'FIXED',
    amountOrPercent: '',
    isTaxable: true,
    isPartOfGross: true,
    isPartOfCTC: true,
    isPFWageComponent: false,
    isESIWageComponent: false
  });

  // Salary structures & calculator sub-module state
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empLoading, setEmpLoading] = useState(false);
  const [empSaving, setEmpSaving] = useState(false);
  const [calcPreviewResult, setCalcPreviewResult] = useState(null);
  const [calcPreviewLogs, setCalcPreviewLogs] = useState([]);
  const [isInspecting, setIsInspecting] = useState(false);
  const [financialYear, setFinancialYear] = useState('2025-26');
  const [expandedLogStep, setExpandedLogStep] = useState(null);
  const [declarations, setDeclarations] = useState({
    sections: {
      section80C: { ppf: 0, elss: 0, lic: 0, nsc: 0, others: 0, total: 0 },
      section80D: { mediclaimSelf: 0, mediclaimParents: 0, total: 0 },
      hra: { annualRent: 0, landlordPan: '', city: 'Non-Metro' },
      otherDeductions: { standardDeduction: 50000, professionalTax: 0, others: 0 }
    }
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Fetch all initial data
  useEffect(() => {
    fetchActiveRuns();
    fetchQueries();
    fetchPendingApprovals();
    fetchWorkflowConfigs();
    fetchAllEmployees();
    fetchMasterComponents();
    fetchSalaryTemplates();
  }, []);

  const fetchMasterComponents = async () => {
    try {
      const data = await safeFetchJson('/api/v1/admin/payroll/v2/config/components');
      if (data.success) {
        setMasterComponents(data.components || []);
      }
    } catch (err) {
      console.error('Failed to fetch master components:', err);
    }
  };

  const fetchSalaryTemplates = async () => {
    try {
      const data = await safeFetchJson('/api/v1/admin/payroll/v2/config/templates');
      if (data.success) {
        setSalaryTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Failed to fetch salary templates:', err);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const data = await safeFetchJson('/api/v1/admin/payroll/employees?limit=1000');
      if (data.success) {
        setAllEmployees(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch employees list:', err);
    }
  };

  const loadEmployeeData = async (empId) => {
    if (!empId) {
      setSelectedEmp(null);
      setCalcPreviewResult(null);
      setCalcPreviewLogs([]);
      setSelectedTemplateId('');
      return;
    }
    setEmpLoading(true);
    try {
      const empData = await safeFetchJson(`/api/v1/admin/payroll/employees/${empId}`);
      
      const payslipStructure = empData.payslipStructure || {};
      if (!payslipStructure.earnings) payslipStructure.earnings = [];
      if (!payslipStructure.deductions) payslipStructure.deductions = [];
      if (!payslipStructure.ctc) payslipStructure.ctc = (payslipStructure.grossSalary || 0) * 12;
      if (!payslipStructure.basicSalary) payslipStructure.basicSalary = (payslipStructure.grossSalary || 0) * 0.5;
      empData.payslipStructure = payslipStructure;
      
      setSelectedEmp(empData);
      
      // Load declarations
      const declData = await safeFetchJson(`/api/v1/admin/payroll/investments?employeeId=${empId}&financialYear=${financialYear}`);
      if (declData && declData.sections) {
        setDeclarations(declData);
      } else {
        // Reset to default empty declaration
        setDeclarations({
          sections: {
            section80C: { ppf: 0, elss: 0, lic: 0, nsc: 0, others: 0, total: 0 },
            section80D: { mediclaimSelf: 0, mediclaimParents: 0, total: 0 },
            hra: { annualRent: 0, landlordPan: '', city: 'Non-Metro' },
            otherDeductions: { standardDeduction: 50000, professionalTax: 0, others: 0 }
          }
        });
      }

      // Load active assignment template
      try {
        const assignRes = await safeFetchJson(`/api/v1/admin/payroll/v2/config/assignments?employeeId=${empId}`);
        if (assignRes && assignRes.success && assignRes.assignments?.length > 0) {
          const activeAssign = assignRes.assignments.find(a => a.status === 'Active');
          if (activeAssign) {
            setSelectedTemplateId(activeAssign.templateId || '');
          }
        }
      } catch (err) {
        console.error('Failed to load employee assignment:', err);
      }
      
      setCalcPreviewResult(null);
      setCalcPreviewLogs([]);
    } catch (err) {
      toast.error(err.message || 'Failed to load employee details');
    } finally {
      setEmpLoading(false);
    }
  };

  const handleSaveEmpPayrollSettings = async () => {
    if (!selectedEmp) return;
    setEmpSaving(true);
    try {
      const basicVal = Number(selectedEmp.payslipStructure.basicSalary || 0);
      const componentValues = { BASIC: basicVal };
      
      const earnings = Array.isArray(selectedEmp.payslipStructure.earnings) ? selectedEmp.payslipStructure.earnings : [];
      const deductions = Array.isArray(selectedEmp.payslipStructure.deductions) ? selectedEmp.payslipStructure.deductions : [];
      
      for (const e of earnings) {
        if (e.enabled !== false) {
          componentValues[e.code] = e.calculationType === 'percentage'
            ? Math.round((basicVal * (e.percentage || 0)) / 100)
            : Number(e.fixedAmount || 0);
        }
      }
      
      for (const d of deductions) {
        if (d.enabled !== false) {
          componentValues[d.code] = d.calculationType === 'percentage'
            ? Math.round((basicVal * (d.percentage || 0)) / 100)
            : Number(d.fixedAmount || 0);
        }
      }

      // Save main employee V2 structure assignment (POST)
      await safeFetchJson('/api/v1/admin/payroll/v2/config/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmp.id || selectedEmp._id,
          templateId: selectedTemplateId || undefined,
          ctc: Number(selectedEmp.payslipStructure.ctc || 0),
          basicSalary: basicVal,
          grossSalary: Number(selectedEmp.payslipStructure.grossSalary || 0),
          componentValues,
          payslipStructure: selectedEmp.payslipStructure,
          revisionReason: 'Admin customized overrides',
          pfApplicable: selectedEmp.pfApplicable,
          esicApplicable: selectedEmp.esicApplicable,
          isTDSApplicable: selectedEmp.isTDSApplicable,
          gratuityApplicable: selectedEmp.gratuityApplicable
        })
      });
      
      // Save investment declarations (POST)
      await safeFetchJson('/api/v1/admin/payroll/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmp.id || selectedEmp._id,
          financialYear,
          sections: declarations.sections,
          status: declarations.status || 'Active'
        })
      });
      
      toast.success('Salary structures and declarations saved successfully!');
      loadEmployeeData(selectedEmp.id || selectedEmp._id);
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setEmpSaving(false);
    }
  };

  const handleToggleComponent = (category, code, enabled, name) => {
    if (!selectedEmp) return;
    const key = category === 'EARNING' ? 'earnings' : 'deductions';
    const list = [...(selectedEmp.payslipStructure[key] || [])];
    const index = list.findIndex(c => c.code === code);
    
    if (index !== -1) {
      list[index] = { ...list[index], enabled };
    } else {
      const master = masterComponents.find(m => m.code === code);
      list.push({
        code,
        name: name || master?.name || code,
        enabled,
        calculationType: master?.formulaType === 'PERCENTAGE' ? 'percentage' : 'fixed',
        percentage: master?.formulaConfig?.percentage || 0,
        fixedAmount: master?.formulaConfig?.value || master?.formulaConfig?.fixedAmount || 0
      });
    }
    
    // Recalculate gross and CTC
    let basicSalary = Number(selectedEmp.payslipStructure.basicSalary || 0);
    let grossSalary = basicSalary;
    
    const earningsList = category === 'EARNING' ? list : (selectedEmp.payslipStructure.earnings || []);
    earningsList.forEach(e => {
      if (e.enabled !== false && e.code !== 'BASIC') {
        const val = e.calculationType === 'percentage' 
          ? (basicSalary * (e.percentage || 0)) / 100 
          : (e.fixedAmount || 0);
        grossSalary += val;
      }
    });

    setSelectedEmp({
      ...selectedEmp,
      payslipStructure: {
        ...selectedEmp.payslipStructure,
        [key]: list,
        grossSalary,
        ctc: grossSalary * 12
      }
    });
  };

  const handleUpdateComponentVal = (category, code, field, value) => {
    if (!selectedEmp) return;
    const key = category === 'EARNING' ? 'earnings' : 'deductions';
    const list = [...(selectedEmp.payslipStructure[key] || [])];
    const index = list.findIndex(c => c.code === code);
    
    if (index !== -1) {
      list[index] = { ...list[index], [field]: value };
    } else {
      const master = masterComponents.find(m => m.code === code);
      list.push({
        code,
        name: master?.name || code,
        enabled: true,
        calculationType: master?.formulaType === 'PERCENTAGE' ? 'percentage' : 'fixed',
        percentage: 0,
        fixedAmount: 0,
        [field]: value
      });
    }

    // Recalculate gross and CTC
    let basicSalary = Number(selectedEmp.payslipStructure.basicSalary || 0);
    let grossSalary = basicSalary;
    
    const earningsList = category === 'EARNING' ? list : (selectedEmp.payslipStructure.earnings || []);
    earningsList.forEach(e => {
      if (e.enabled !== false && e.code !== 'BASIC') {
        const val = e.calculationType === 'percentage' 
          ? (basicSalary * (e.percentage || 0)) / 100 
          : (e.fixedAmount || 0);
        grossSalary += val;
      }
    });

    setSelectedEmp({
      ...selectedEmp,
      payslipStructure: {
        ...selectedEmp.payslipStructure,
        [key]: list,
        grossSalary,
        ctc: grossSalary * 12
      }
    });
  };

  const runCalculationInspection = async () => {
    if (!selectedEmp) return;
    setIsInspecting(true);
    try {
      const data = await safeFetchJson('/api/v1/admin/payroll/v2/calculate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmp.id || selectedEmp._id,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        })
      });
      if (data.success) {
        setCalcPreviewResult(data.result);
        setCalcPreviewLogs(data.logs || []);
        toast.success('Calculations executed. Expand timeline steps below.');
      } else {
        toast.error(data.error || 'Failed to inspect calculations');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to run calculator engine');
    } finally {
      setIsInspecting(false);
    }
  };

  const fetchActiveRuns = async (selectId = null) => {
    try {
      const data = await safeFetchJson('/api/v1/admin/payroll/v2/runs');
      if (data.success) {
        setRuns(data.runs);
        if (data.runs.length > 0) {
          const targetId = selectId || data.runs[0].id;
          loadRunDetails(targetId);
        } else {
          setActiveRun(null);
          setRunEmployees([]);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch active runs');
    }
  };

  const loadRunDetails = async (runId) => {
    setLoadingRun(true);
    try {
      const data = await safeFetchJson(`/api/v1/admin/payroll/v2/runs/${runId}`);
      if (data.success) {
        setActiveRun(data.run);
        setRunEmployees(data.run.employees || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load run details');
    } finally {
      setLoadingRun(false);
    }
  };

  const fetchQueries = async () => {
    try {
      const data = await safeFetchJson('/api/v1/admin/payroll/v2/queries');
      if (data.success) {
        setQueries(data.queries);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch queries');
    }
  };

  const fetchPendingApprovals = async () => {
    setApprovalsLoading(true);
    try {
      const data = await safeFetchJson('/api/v1/admin/payroll/v2/approvals');
      if (data.success) {
        setPendingApprovals(data.pending);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch pending approvals');
    } finally {
      setApprovalsLoading(false);
    }
  };

  const fetchWorkflowConfigs = async () => {
    try {
      const data = await safeFetchJson('/api/v1/admin/payroll/v2/config/workflows');
      if (data.success) {
        setWorkflowConfigs(data.configs);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch workflow configurations');
    }
  };

  const startNewRun = async (e) => {
    e.preventDefault();
    const month = parseInt(e.target.month.value);
    const year = parseInt(e.target.year.value);
    try {
      const data = await safeFetchJson('/api/v1/admin/payroll/v2/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year })
      });
      if (data.success) {
        toast.success('New monthly payroll run initialized');
        fetchActiveRuns(data.run.id);
      } else {
        toast.error(data.error || 'Failed to initialize run');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to process request');
    }
  };

  const triggerCalculations = async (employeeId = null) => {
    if (!activeRun) return;
    setCalculating(true);
    try {
      const data = await safeFetchJson(`/api/v1/admin/payroll/v2/runs/${activeRun.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeId ? { employeeId } : {})
      });
      if (data.success) {
        toast.success(employeeId ? 'Employee calculation completed' : `Calculated. Success: ${data.summary.success}, Errors: ${data.summary.errors}`);
        loadRunDetails(activeRun.id);
      } else {
        toast.error(data.error || 'Failed to calculate');
      }
    } catch (err) {
      toast.error(err.message || 'Calculations process failed');
    } finally {
      setCalculating(false);
    }
  };

  const handleRunAction = async (action) => {
    if (!activeRun) return;
    try {
      const data = await safeFetchJson(`/api/v1/admin/payroll/v2/runs/${activeRun.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (data.success) {
        toast.success(`Action successfully executed: ${action.replace(/_/g, ' ')}`);
        loadRunDetails(activeRun.id);
      } else {
        toast.error(data.error || 'Failed to perform action');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to process action');
    }
  };

  const processApprovalDecision = async (instanceId, stepId, action) => {
    const comments = decisionComments[stepId] || '';
    try {
      const data = await safeFetchJson('/api/v1/admin/payroll/v2/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId, stepId, action, comments })
      });
      if (data.success) {
        toast.success(`Workflow item successfully ${action === 'APPROVE' ? 'approved' : 'rejected'}`);
        fetchPendingApprovals();
        fetchActiveRuns();
      } else {
        toast.error(data.error || 'Failed to register decision');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to register decision');
    }
  };

  const postCommentReply = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedQuery) return;
    setReplyLoading(true);
    try {
      const data = await safeFetchJson(`/api/v1/admin/payroll/v2/queries/${selectedQuery.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newComment })
      });
      if (data.success) {
        setNewComment('');
        const detailData = await safeFetchJson(`/api/v1/admin/payroll/v2/queries/${selectedQuery.id}`);
        if (detailData.success) {
          setSelectedQuery(detailData.query);
        }
        fetchQueries();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to post reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const resolveQuery = async (status) => {
    if (!selectedQuery) return;
    try {
      const data = await safeFetchJson(`/api/v1/admin/payroll/v2/queries/${selectedQuery.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (data.success) {
        toast.success(`Query thread marked as ${status}`);
        const detailData = await safeFetchJson(`/api/v1/admin/payroll/v2/queries/${selectedQuery.id}`);
        if (detailData.success) {
          setSelectedQuery(detailData.query);
          fetchQueries();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update query status');
    }
  };

  const handleOpenInspectorFromDraft = async (employeeId) => {
    setActiveTab('salary-structures');
    // Run preview math directly
    setEmpLoading(true);
    try {
      // 1. Fetch details
      const empData = await safeFetchJson(`/api/v1/admin/payroll/employees/${employeeId}`);
      
      const payslipStructure = empData.payslipStructure || {};
      if (!payslipStructure.earnings) payslipStructure.earnings = [];
      if (!payslipStructure.deductions) payslipStructure.deductions = [];
      if (!payslipStructure.ctc) payslipStructure.ctc = (payslipStructure.grossSalary || 0) * 12;
      if (!payslipStructure.basicSalary) payslipStructure.basicSalary = (payslipStructure.grossSalary || 0) * 0.5;
      empData.payslipStructure = payslipStructure;

      setSelectedEmp(empData);
      
      const declData = await safeFetchJson(`/api/v1/admin/payroll/investments?employeeId=${employeeId}&financialYear=${financialYear}`);
      if (declData && declData.sections) {
        setDeclarations(declData);
      } else {
        setDeclarations({
          sections: {
            section80C: { ppf: 0, elss: 0, lic: 0, nsc: 0, others: 0, total: 0 },
            section80D: { mediclaimSelf: 0, mediclaimParents: 0, total: 0 },
            hra: { annualRent: 0, landlordPan: '', city: 'Non-Metro' },
            otherDeductions: { standardDeduction: 50000, professionalTax: 0, others: 0 }
          }
        });
      }
      
      // Load active assignment template
      try {
        const assignRes = await safeFetchJson(`/api/v1/admin/payroll/v2/config/assignments?employeeId=${employeeId}`);
        if (assignRes && assignRes.success && assignRes.assignments?.length > 0) {
          const activeAssign = assignRes.assignments.find(a => a.status === 'Active');
          if (activeAssign) {
            setSelectedTemplateId(activeAssign.templateId || '');
          }
        }
      } catch (err) {
        console.error('Failed to load employee assignment:', err);
      }

      // 2. Fetch inspection
      const data = await safeFetchJson('/api/v1/admin/payroll/v2/calculate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          month: activeRun?.month || new Date().getMonth() + 1,
          year: activeRun?.year || new Date().getFullYear()
        })
      });
      if (data.success) {
        setCalcPreviewResult(data.result);
        setCalcPreviewLogs(data.logs || []);
        toast.success('Calculations inspection successfully loaded.');
      } else {
        toast.error(data.error || 'Failed to inspect calculations');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to inspect employee calculations');
    } finally {
      setEmpLoading(false);
    }
  };

  const saveWorkflowConfig = async (e) => {
    e.preventDefault();
    const type = e.target.type.value;
    const levelsStr = e.target.levels.value;
    try {
      const parsedLevels = JSON.parse(levelsStr);
      const data = await safeFetchJson('/api/v1/admin/payroll/v2/config/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowType: type, approvalLevels: parsedLevels })
      });
      if (data.success) {
        toast.success('Workflow configuration saved');
        fetchWorkflowConfigs();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Invalid JSON format for approval levels');
    }
  };

  const handleSaveComponent = async (e) => {
    e.preventDefault();
    const { code, name, category, formulaType, amountOrPercent, isTaxable, isPartOfGross, isPartOfCTC, isPFWageComponent, isESIWageComponent } = componentForm;

    if (!code.trim() || !name.trim() || !formulaType || !amountOrPercent) {
      toast.error('All fields are required');
      return;
    }

    const valueNum = parseFloat(amountOrPercent);
    if (isNaN(valueNum) || valueNum < 0) {
      toast.error('Please enter a valid positive number');
      return;
    }

    const formulaConfig = formulaType === 'PERCENTAGE' 
      ? { percentageOf: 'BASIC', percentage: valueNum }
      : { value: valueNum, fixedAmount: valueNum };

    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category,
      formulaType,
      formulaConfig,
      isTaxable,
      isPartOfGross,
      isPartOfCTC,
      isPFWageComponent,
      isESIWageComponent
    };

    try {
      let data;
      if (editingComponent) {
        // Edit mode (PUT)
        data = await safeFetchJson('/api/v1/admin/payroll/v2/config/components', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingComponent.id, ...payload })
        });
      } else {
        // Create mode (POST)
        data = await safeFetchJson('/api/v1/admin/payroll/v2/config/components', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (data.success) {
        toast.success(editingComponent ? 'Salary component updated successfully' : 'Salary component created successfully');
        setEditingComponent(null);
        setComponentForm({
          code: '',
          name: '',
          category: 'EARNING',
          formulaType: 'FIXED',
          amountOrPercent: '',
          isTaxable: true,
          isPartOfGross: true,
          isPartOfCTC: true,
          isPFWageComponent: false,
          isESIWageComponent: false
        });
        fetchMasterComponents();
      } else {
        toast.error(data.error || 'Failed to save component');
      }
    } catch (err) {
      toast.error(err.message || 'Network error saving component');
    }
  };

  const handleEditComponent = (comp) => {
    setEditingComponent(comp);
    const amountVal = comp.formulaType === 'PERCENTAGE'
      ? comp.formulaConfig?.percentage || 0
      : comp.formulaConfig?.value || comp.formulaConfig?.fixedAmount || 0;
    setComponentForm({
      code: comp.code,
      name: comp.name,
      category: comp.category,
      formulaType: comp.formulaType,
      amountOrPercent: amountVal.toString(),
      isTaxable: comp.isTaxable !== false,
      isPartOfGross: comp.isPartOfGross !== false,
      isPartOfCTC: comp.isPartOfCTC !== false,
      isPFWageComponent: comp.isPFWageComponent === true,
      isESIWageComponent: comp.isESIWageComponent === true
    });
  };

  const handleDeleteComponent = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this component? It will no longer be available for salary assignment.')) {
      return;
    }
    try {
      const data = await safeFetchJson(`/api/v1/admin/payroll/v2/config/components?id=${id}`, {
        method: 'DELETE'
      });
      if (data.success) {
        toast.success('Salary component deactivated successfully');
        fetchMasterComponents();
        if (editingComponent?.id === id) {
          setEditingComponent(null);
          setComponentForm({
            code: '',
            name: '',
            category: 'EARNING',
            formulaType: 'FIXED',
            amountOrPercent: '',
            isTaxable: true,
            isPartOfGross: true,
            isPartOfCTC: true,
            isPFWageComponent: false,
            isESIWageComponent: false
          });
        }
      } else {
        toast.error(data.error || 'Failed to deactivate component');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to deactivate component');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-8 bg-slate-50 text-slate-800 font-sans min-h-[calc(100vh-80px)]">
      
      {/* Tab Navigation header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">WorkGrid Payroll V2</h1>
            {runs.length > 0 && (
              <select
                value={activeRun?.id || ''}
                onChange={(e) => loadRunDetails(e.target.value)}
                className="ml-3 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none shadow-sm hover:border-indigo-500 transition-all text-slate-700"
              >
                {runs.map(run => (
                  <option key={run.id} value={run.id}>
                    {run.month}/{run.year} - {run.runCode} ({run.status})
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Enterprise compensation calculation engine and compliance pipeline.</p>
        </div>

        {/* Tabs Bar */}
        <div className="flex flex-wrap items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-sm shrink-0">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
            { id: 'payroll-run', name: 'Run Wizard', icon: CheckSquare },
            { id: 'salary-structures', name: 'Salary structures', icon: Users },
            { id: 'queries', name: 'Queries', icon: MessageSquare },
            { id: 'approvals', name: 'Approvals', icon: TrendingUp },
            { id: 'reports', name: 'Reports', icon: FileSpreadsheet },
            { id: 'configs', name: 'Settings', icon: Settings2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                router.replace(`/admin/payroll/v2?tab=${tab.id}`);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 outline-none border border-transparent ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm border-indigo-650'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content selection */}
      {activeTab === 'dashboard' && (
        <PayrollDashboard
          activeRun={activeRun}
          runEmployees={runEmployees}
          queries={queries}
          pendingApprovals={pendingApprovals}
          setActiveTab={setActiveTab}
          startNewRun={startNewRun}
        />
      )}

      {activeTab === 'payroll-run' && (
        <PayrollRunWizard
          activeRun={activeRun}
          runEmployees={runEmployees}
          calculating={calculating}
          triggerCalculations={triggerCalculations}
          handleRunAction={handleRunAction}
          handleOpenInspectorFromDraft={handleOpenInspectorFromDraft}
        />
      )}

      {activeTab === 'salary-structures' && (
        <SalaryStructures
          activeRun={activeRun}
          allEmployees={allEmployees}
          selectedEmp={selectedEmp}
          setSelectedEmp={setSelectedEmp}
          empLoading={empLoading}
          empSaving={empSaving}
          loadEmployeeData={loadEmployeeData}
          handleSaveEmpPayrollSettings={handleSaveEmpPayrollSettings}
          handleToggleComponent={handleToggleComponent}
          handleUpdateComponentVal={handleUpdateComponentVal}
          masterComponents={masterComponents}
          salaryTemplates={salaryTemplates}
          calcPreviewResult={calcPreviewResult}
          calcPreviewLogs={calcPreviewLogs}
          expandedLogStep={expandedLogStep}
          setExpandedLogStep={setExpandedLogStep}
          isInspecting={isInspecting}
          runCalculationInspection={runCalculationInspection}
          financialYear={financialYear}
          declarations={declarations}
          setDeclarations={setDeclarations}
          selectedTemplateId={selectedTemplateId}
          setSelectedTemplateId={setSelectedTemplateId}
        />
      )}

      {activeTab === 'queries' && (
        <PayrollQueryDesk
          queries={queries}
          selectedQuery={selectedQuery}
          setSelectedQuery={setSelectedQuery}
          newComment={newComment}
          setNewComment={setNewComment}
          postCommentReply={postCommentReply}
          resolveQuery={resolveQuery}
          replyLoading={replyLoading}
        />
      )}

      {activeTab === 'approvals' && (
        <PayrollApprovals
          pendingApprovals={pendingApprovals}
          decisionComments={decisionComments}
          setDecisionComments={setDecisionComments}
          processApprovalDecision={processApprovalDecision}
        />
      )}

      {activeTab === 'reports' && (
        <PayrollReports
          runs={runs}
        />
      )}

      {activeTab === 'configs' && (
        <PayrollConfig
          workflowConfigs={workflowConfigs}
          masterComponents={masterComponents}
          editingComponent={editingComponent}
          setEditingComponent={setEditingComponent}
          componentForm={componentForm}
          setComponentForm={setComponentForm}
          configSubTab={configSubTab}
          setConfigSubTab={setConfigSubTab}
          saveWorkflowConfig={saveWorkflowConfig}
          handleSaveComponent={handleSaveComponent}
          handleEditComponent={handleEditComponent}
          handleDeleteComponent={handleDeleteComponent}
        />
      )}

    </div>
  );
}
