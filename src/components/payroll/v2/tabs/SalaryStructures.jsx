import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Save, RotateCw, Info, TrendingUp, Users, ExternalLink, FileText, CheckCircle2, Check, Paperclip } from 'lucide-react';
import CalculationInspector from './CalculationInspector';

export default function SalaryStructures({
  activeRun,
  allEmployees = [],
  selectedEmp,
  setSelectedEmp,
  empLoading,
  empSaving,
  loadEmployeeData,
  handleSaveEmpPayrollSettings,
  handleToggleComponent,
  handleUpdateComponentVal,
  masterComponents = [],
  salaryTemplates = [],
  calcPreviewResult,
  calcPreviewLogs = [],
  expandedLogStep,
  setExpandedLogStep,
  isInspecting,
  runCalculationInspection,
  financialYear,
  declarations,
  setDeclarations,
  selectedTemplateId,
  setSelectedTemplateId
}) {
  const isClosed = activeRun?.status === 'CLOSED';
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [inspectingTab, setInspectingTab] = useState('structure');
  
  // Uploaded docs state
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const fetchUploadedDocs = async () => {
    if (!selectedEmp) return;
    const empId = selectedEmp.id || selectedEmp._id;
    if (!empId) return;

    setDocsLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/payroll/investments?employeeId=${empId}&financialYear=2025-26`);
      const data = await res.json();
      if (data && data.proofs) {
        setUploadedDocs(data.proofs);
      } else {
        setUploadedDocs([]);
      }
    } catch (err) {
      console.error('Failed to load employee uploaded documents:', err);
      setUploadedDocs([]);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleApproveDoc = async (proofId) => {
    if (!selectedEmp) return;
    const empId = selectedEmp.id || selectedEmp._id;
    if (!empId) return;

    try {
      // 1. Fetch current declaration
      const res = await fetch(`/api/v1/admin/payroll/investments?employeeId=${empId}&financialYear=2025-26`);
      const data = await res.json();
      
      // 2. Update the status of the matching proof
      const existingProofs = data.proofs || [];
      const updatedProofs = existingProofs.map(p => {
        if (p.id === proofId) {
          return { ...p, status: 'Approved', adminRemarks: 'Approved by admin.' };
        }
        return p;
      });

      // 3. Save it back
      const saveRes = await fetch('/api/v1/admin/payroll/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empId,
          financialYear: '2025-26',
          sections: data.sections,
          proofs: updatedProofs
        })
      });

      const saveData = await saveRes.json();
      if (saveData.id || saveData._id) {
        import('sonner').then(mod => mod.toast.success('Proof document marked as verified & approved!'));
        fetchUploadedDocs();
      } else {
        import('sonner').then(mod => mod.toast.error('Failed to approve document'));
      }
    } catch (err) {
      import('sonner').then(mod => mod.toast.error('Error approving document'));
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUploadedDocs();
  }, [selectedEmp]);
  
  // Roster Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter roster
  const filteredEmployees = allEmployees.filter(emp => {
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    const code = (emp.employeeId || '').toLowerCase();
    const matchSearch = fullName.includes(searchQuery.toLowerCase()) || code.includes(searchQuery.toLowerCase());
    const matchDept = !selectedDept || emp.department === selectedDept;
    return matchSearch && matchDept;
  });

  const departments = Array.from(new Set(allEmployees.map(e => e.department).filter(Boolean)));

  // Reset pagination when search queries or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDept]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Left Column: Search & Selection */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Employee Roster</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Select an employee to manage base settings, investment declarations, and run math calculators.</p>
          </div>
          
          {/* Search inputs */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search name/ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
            <select 
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white text-slate-700"
            >
              <option value="">All Departments...</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Employees list */}
          <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
            {paginatedEmployees.map(emp => (
              <div
                key={emp.id || emp._id}
                onClick={() => loadEmployeeData(emp.id || emp._id)}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between border ${
                  selectedEmp?.id === emp.id || selectedEmp?._id === emp._id
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                    : 'bg-white border-transparent hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-xs text-slate-800">{emp.firstName || emp.personalDetails?.firstName} {emp.lastName || emp.personalDetails?.lastName}</p>
                    <span className={`px-1.5 py-0.2 text-[8px] font-extrabold rounded-md uppercase border ${
                      (emp.taxRegime || 'new').toLowerCase() === 'old'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {(emp.taxRegime || 'new').toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500">{emp.employeeId} • {emp.designation}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            ))}
            {filteredEmployees.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">No matching employees found.</p>
            )}
          </div>

          {/* Employee Roster Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 font-bold disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
              >
                Prev
              </button>
              <span className="text-slate-500 font-bold">
                {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 font-bold disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Selected Summary Card */}
        {selectedEmp && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-3.5 pb-3 border-b border-slate-100">
              <div className="h-10 w-10 bg-indigo-100 text-indigo-700 font-black rounded-full flex items-center justify-center text-sm">
                {(selectedEmp.firstName || selectedEmp.personalDetails?.firstName)?.[0]}
              </div>
              <div>
                <p className="font-extrabold text-xs text-slate-900">{selectedEmp.firstName || selectedEmp.personalDetails?.firstName} {selectedEmp.lastName || selectedEmp.personalDetails?.lastName}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{selectedEmp.designation || selectedEmp.jobDetails?.designation}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Base Salary (Basic):</span>
                <span className="font-bold text-slate-800">₹{Number(selectedEmp.payslipStructure?.basicSalary || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gross Salary Override:</span>
                <span className="font-bold text-slate-800">₹{Number(selectedEmp.payslipStructure?.grossSalary || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tax Regime:</span>
                <span className="font-black text-indigo-600 uppercase">{selectedEmp.taxRegime || 'NEW'} Regime</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Calculations & Setup Tab Panels */}
      <div className="lg:col-span-8 space-y-6">
        
        {selectedEmp ? (
          <div className="space-y-6">
            {isClosed && (
              <div className="bg-amber-50 border border-amber-250 p-4 rounded-xl flex items-center space-x-3 text-amber-800 text-xs font-bold shadow-sm">
                <span>⚠️ Note: The selected payroll run is CLOSED. Salary structures and declarations are in read-only audit mode.</span>
              </div>
            )}
            
            {/* Header Setup Actions */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-base font-black text-slate-900">Payroll parameters & overrides</h2>
                <p className="text-[10px] text-slate-500">Adjust compensation structures, toggle statutory schemes, and declare investment proofs.</p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <button
                  onClick={runCalculationInspection}
                  disabled={isInspecting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isInspecting ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
                  <span>{isInspecting ? 'Running math...' : 'Run Calculator Inspector'}</span>
                </button>

                <button
                  onClick={handleSaveEmpPayrollSettings}
                  disabled={empSaving || isClosed}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {empSaving ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  <span>Save Settings</span>
                </button>
              </div>
            </div>

            <div className="flex border-b border-slate-200 gap-6">
              {[
                { id: 'structure', name: 'Compensation Details' },
                { id: 'statutory', name: 'Statutory applicability' },
                { id: 'declarations', name: 'Tax Slabs & Declarations' },
                { id: 'uploaded-docs', name: 'Uploaded Documents' },
                { id: 'inspector', name: 'Step-by-step math log' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setInspectingTab(t.id)}
                  className={`pb-3 text-xs font-bold border-b-2 transition-all outline-none ${
                    inspectingTab === t.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            {/* SUB PANEL 1: Compensation override */}
            {inspectingTab === 'structure' && (
              <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm space-y-8 animate-in fade-in duration-200 font-sans">
                
                {/* Row 1: Base settings & templates */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-850">Salary Configurator & Component Master</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Customize allowances, deductions, and wage parameters for this employee.</p>
                  </div>
                  
                  <div className="flex items-center space-x-2 shrink-0">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Apply Template:</label>
                    <select
                      value={selectedTemplateId}
                      disabled={isClosed}
                      onChange={(e) => {
                        const tempId = e.target.value;
                        setSelectedTemplateId(tempId);
                        if (tempId) {
                          const template = salaryTemplates.find(t => t.id === tempId);
                          if (template) {
                            const basicVal = selectedEmp.payslipStructure?.basicSalary || Math.round((selectedEmp.payslipStructure?.ctc || 0) / 12 * 0.5);
                            const earnings = [];
                            const deductions = [];
                            
                            template.components.forEach(tc => {
                              const master = masterComponents.find(m => m.code === tc.componentCode);
                              if (!master) return;
                              
                              const item = {
                                code: master.code,
                                name: master.name,
                                enabled: true,
                                calculationType: master.formulaType === 'PERCENTAGE' ? 'percentage' : 'fixed',
                                percentage: master.formulaConfig?.percentage || 0,
                                fixedAmount: master.formulaConfig?.value || master.formulaConfig?.fixedAmount || 0
                              };
                              
                              if (master.category === 'EARNING') {
                                earnings.push(item);
                              } else if (master.category === 'DEDUCTION') {
                                deductions.push(item);
                              }
                            });
                            
                            // Calculate gross
                            let grossVal = basicVal;
                            earnings.forEach(e => {
                              const val = e.calculationType === 'percentage' 
                                ? (basicVal * (e.percentage || 0)) / 100 
                                : (e.fixedAmount || 0);
                              grossVal += val;
                            });

                            setSelectedEmp({
                              ...selectedEmp,
                              payslipStructure: {
                                ...selectedEmp.payslipStructure,
                                earnings,
                                deductions,
                                grossSalary: grossVal,
                                ctc: grossVal * 12
                              }
                            });
                          }
                        }
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <option value="">Select Template...</option>
                      {salaryTemplates.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}{t.employeeType ? ` (${t.employeeType.replace(/_/g, ' ')})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Basic inputs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Annual CTC</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input 
                        type="number" 
                        value={selectedEmp.payslipStructure?.ctc || 0}
                        disabled={isClosed}
                        onChange={(e) => {
                          const annual = Number(e.target.value) || 0;
                          const monthly = annual / 12;
                          const basic = monthly * 0.5;
                          setSelectedEmp({
                            ...selectedEmp,
                            payslipStructure: {
                              ...selectedEmp.payslipStructure,
                              ctc: annual,
                              grossSalary: monthly,
                              basicSalary: basic
                            }
                          });
                        }}
                        className="w-full pl-7 pr-3 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-900 focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Monthly CTC</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input 
                        type="number" 
                        value={Math.round((selectedEmp.payslipStructure?.ctc || 0) / 12)}
                        disabled={isClosed}
                        onChange={(e) => {
                          const monthly = Number(e.target.value) || 0;
                          const annual = monthly * 12;
                          const basic = monthly * 0.5;
                          setSelectedEmp({
                            ...selectedEmp,
                            payslipStructure: {
                              ...selectedEmp.payslipStructure,
                              ctc: annual,
                              grossSalary: monthly,
                              basicSalary: basic
                            }
                          });
                        }}
                        className="w-full pl-7 pr-3 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-900 focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Monthly Basic Salary</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input 
                        type="number" 
                        value={selectedEmp.payslipStructure?.basicSalary || 0}
                        disabled={isClosed}
                        onChange={(e) => {
                          const basic = Number(e.target.value) || 0;
                          // Recalculate gross
                          let gross = basic;
                          const earnings = selectedEmp.payslipStructure?.earnings || [];
                          earnings.forEach(item => {
                            if (item.enabled !== false && item.code !== 'BASIC') {
                              gross += item.calculationType === 'percentage' 
                                ? (basic * (item.percentage || 0)) / 100 
                                : (item.fixedAmount || 0);
                            }
                          });
                          setSelectedEmp({
                            ...selectedEmp,
                            payslipStructure: {
                              ...selectedEmp.payslipStructure,
                              basicSalary: basic,
                              grossSalary: gross,
                              ctc: gross * 12
                            }
                          });
                        }}
                        className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Monthly Gross Salary Target</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input 
                        type="number" 
                        value={selectedEmp.payslipStructure?.grossSalary || 0}
                        readOnly
                        className="w-full pl-7 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 cursor-not-allowed outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Component Allowances */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Component Allowances (Earnings)</h4>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Auto-prorates during LOP</span>
                  </div>

                  <div className="space-y-3">
                    {/* Fixed HRA Earning Component */}
                    {(() => {
                      const hraConfig = (selectedEmp.payslipStructure?.earnings || []).find(e => e.code === 'HRA');
                      const isHraEnabled = hraConfig ? hraConfig.enabled !== false : false;
                      const hraCalcType = hraConfig ? hraConfig.calculationType || 'fixed' : 'percentage';
                      const hraPercentVal = hraConfig ? hraConfig.percentage || 0 : 40;
                      const hraFixedVal = hraConfig ? hraConfig.fixedAmount || 0 : 0;
                      
                      const basicVal = Number(selectedEmp.payslipStructure?.basicSalary || 0);
                      const hraCalculatedMonthly = isHraEnabled 
                        ? (hraCalcType === 'percentage' ? (basicVal * hraPercentVal) / 100 : hraFixedVal)
                        : 0;

                      return (
                        <div className={`p-4 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
                          isHraEnabled ? 'bg-indigo-50/20 border-indigo-150' : 'bg-slate-50/50 border-slate-200 opacity-60'
                        }`}>
                          <div className="flex items-center space-x-3.5">
                            <input 
                              type="checkbox"
                              checked={isHraEnabled}
                              disabled={isClosed}
                              onChange={(e) => handleToggleComponent('EARNING', 'HRA', e.target.checked, 'Home Rent Allowance (HRA)')}
                              className="h-4.5 w-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                            <div>
                              <p className="font-bold text-xs text-slate-800">Home Rent Allowance (HRA)</p>
                              <span className="text-[10px] text-slate-400 font-mono uppercase">HRA</span>
                            </div>
                          </div>

                          {isHraEnabled && (
                            <div className="flex flex-wrap items-center gap-4">
                              <div className="flex items-center space-x-1.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Type:</label>
                                <select 
                                  value={hraCalcType}
                                  disabled={isClosed}
                                  onChange={(e) => handleUpdateComponentVal('EARNING', 'HRA', 'calculationType', e.target.value)}
                                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold outline-none text-slate-700"
                                >
                                  <option value="fixed">Fixed</option>
                                  <option value="percentage">Percentage (%) of Basic</option>
                                </select>
                              </div>

                              <div className="flex items-center space-x-1.5 w-28">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">{hraCalcType === 'percentage' ? '%' : '₹'}:</label>
                                <input 
                                  type="number"
                                  value={hraCalcType === 'percentage' ? hraPercentVal : hraFixedVal}
                                  disabled={isClosed}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    handleUpdateComponentVal('EARNING', 'HRA', hraCalcType === 'percentage' ? 'percentage' : 'fixedAmount', val);
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold outline-none text-slate-800"
                                />
                              </div>

                              <div className="text-right w-24">
                                <span className="text-[9px] text-slate-400 uppercase block font-bold">Monthly Val</span>
                                <span className="font-black text-indigo-600 text-xs">₹{Math.round(hraCalculatedMonthly).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          )}
                          {!isHraEnabled && (
                            <span className="text-slate-400 text-xs font-bold font-mono">Inactive</span>
                          )}
                        </div>
                      );
                    })()}

                    {masterComponents.filter(m => m.category === 'EARNING' && m.code !== 'BASIC' && m.code !== 'HRA').map(master => {
                      const config = (selectedEmp.payslipStructure?.earnings || []).find(e => e.code === master.code);
                      const isEnabled = config ? config.enabled !== false : false;
                      const calcType = config ? config.calculationType || 'fixed' : (master.formulaType === 'PERCENTAGE' ? 'percentage' : 'fixed');
                      const percentVal = config ? config.percentage || 0 : (master.formulaType === 'PERCENTAGE' ? (master.formulaConfig?.percentage || 0) : 0);
                      const fixedVal = config ? config.fixedAmount || 0 : (master.formulaType === 'PERCENTAGE' ? 0 : (master.formulaConfig?.value || master.formulaConfig?.fixedAmount || 0));
                      
                      const basicVal = Number(selectedEmp.payslipStructure?.basicSalary || 0);
                      const calculatedMonthly = isEnabled 
                        ? (calcType === 'percentage' ? (basicVal * percentVal) / 100 : fixedVal)
                        : 0;

                      return (
                        <div key={master.code} className={`p-4 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
                          isEnabled ? 'bg-indigo-50/20 border-indigo-150' : 'bg-slate-50/50 border-slate-200 opacity-60'
                        }`}>
                          <div className="flex items-center space-x-3.5">
                            <input 
                              type="checkbox"
                              checked={isEnabled}
                              disabled={isClosed}
                              onChange={(e) => handleToggleComponent('EARNING', master.code, e.target.checked, master.name)}
                              className="h-4.5 w-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                            <div>
                              <p className="font-bold text-xs text-slate-800">{master.name}</p>
                              <span className="text-[10px] text-slate-400 font-mono uppercase">{master.code}</span>
                            </div>
                          </div>

                          {isEnabled && (
                            <div className="flex flex-wrap items-center gap-4">
                              <div className="flex items-center space-x-1.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Type:</label>
                                <select 
                                  value={calcType}
                                  disabled={isClosed}
                                  onChange={(e) => handleUpdateComponentVal('EARNING', master.code, 'calculationType', e.target.value)}
                                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold outline-none text-slate-700"
                                >
                                  <option value="fixed">Fixed</option>
                                  <option value="percentage">Percentage (%) of Basic</option>
                                </select>
                              </div>

                              <div className="flex items-center space-x-1.5 w-28">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">{calcType === 'percentage' ? '%' : '₹'}:</label>
                                <input 
                                  type="number"
                                  value={calcType === 'percentage' ? percentVal : fixedVal}
                                  disabled={isClosed}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    handleUpdateComponentVal('EARNING', master.code, calcType === 'percentage' ? 'percentage' : 'fixedAmount', val);
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold outline-none text-slate-800"
                                />
                              </div>

                              <div className="text-right w-24">
                                <span className="text-[9px] text-slate-400 uppercase block font-bold">Monthly Val</span>
                                <span className="font-black text-indigo-600 text-xs">₹{Math.round(calculatedMonthly).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          )}
                          {!isEnabled && (
                            <span className="text-slate-400 text-xs font-bold font-mono">Inactive</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Row 4: Component Deductions */}
                <div className="space-y-4 pt-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Component Deductions (Custom/Voluntary)</h4>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Statutory EPF/ESI/PT are auto-applied</span>
                  </div>

                  <div className="space-y-3">
                    {masterComponents.filter(m => m.category === 'DEDUCTION').map(master => {
                      const config = (selectedEmp.payslipStructure?.deductions || []).find(d => d.code === master.code);
                      const isEnabled = config ? config.enabled !== false : false;
                      const calcType = config ? config.calculationType || 'fixed' : (master.formulaType === 'PERCENTAGE' ? 'percentage' : 'fixed');
                      const percentVal = config ? config.percentage || 0 : (master.formulaType === 'PERCENTAGE' ? (master.formulaConfig?.percentage || 0) : 0);
                      const fixedVal = config ? config.fixedAmount || 0 : (master.formulaType === 'PERCENTAGE' ? 0 : (master.formulaConfig?.value || master.formulaConfig?.fixedAmount || 0));
                      
                      const basicVal = Number(selectedEmp.payslipStructure?.basicSalary || 0);
                      const calculatedMonthly = isEnabled 
                        ? (calcType === 'percentage' ? (basicVal * percentVal) / 100 : fixedVal)
                        : 0;

                      return (
                        <div key={master.code} className={`p-4 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
                          isEnabled ? 'bg-rose-50/20 border-rose-150' : 'bg-slate-50/50 border-slate-200 opacity-60'
                        }`}>
                          <div className="flex items-center space-x-3.5">
                            <input 
                              type="checkbox"
                              checked={isEnabled}
                              disabled={isClosed}
                              onChange={(e) => handleToggleComponent('DEDUCTION', master.code, e.target.checked, master.name)}
                              className="h-4.5 w-4.5 text-rose-600 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                            />
                            <div>
                              <p className="font-bold text-xs text-slate-800">{master.name}</p>
                              <span className="text-[10px] text-slate-400 font-mono uppercase">{master.code}</span>
                            </div>
                          </div>

                          {isEnabled && (
                            <div className="flex flex-wrap items-center gap-4">
                              <div className="flex items-center space-x-1.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Type:</label>
                                <select 
                                  value={calcType}
                                  disabled={isClosed}
                                  onChange={(e) => handleUpdateComponentVal('DEDUCTION', master.code, 'calculationType', e.target.value)}
                                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold outline-none text-slate-700"
                                >
                                  <option value="fixed">Fixed</option>
                                  <option value="percentage">Percentage (%) of Basic</option>
                                </select>
                              </div>

                              <div className="flex items-center space-x-1.5 w-28">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">{calcType === 'percentage' ? '%' : '₹'}:</label>
                                <input 
                                  type="number"
                                  value={calcType === 'percentage' ? percentVal : fixedVal}
                                  disabled={isClosed}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    handleUpdateComponentVal('DEDUCTION', master.code, calcType === 'percentage' ? 'percentage' : 'fixedAmount', val);
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold outline-none text-slate-800"
                                />
                              </div>

                              <div className="text-right w-24">
                                <span className="text-[9px] text-slate-400 uppercase block font-bold">Monthly Val</span>
                                <span className="font-black text-rose-600 text-xs">₹{Math.round(calculatedMonthly).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          )}
                          {!isEnabled && (
                            <span className="text-slate-400 text-xs font-bold font-mono">Inactive</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* SUB PANEL 2: Statutory Switches */}
            {inspectingTab === 'statutory' && (
              <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm space-y-6 animate-in fade-in duration-200">
                <h3 className="font-extrabold text-sm text-slate-800 pb-2 border-b border-slate-100">Statutory Scheme Applicabilities</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: 'PF Applicable', key: 'pfApplicable', val: 'yes' },
                    { label: 'ESIC Applicable', key: 'esicApplicable', val: 'yes' },
                    { label: 'TDS (Tax) Deductions', key: 'isTDSApplicable', val: true },
                    { label: 'Gratuity Scheme', key: 'gratuityApplicable', val: 'yes' },
                    { label: 'HRA Exemption', key: 'hraApplicable', val: 'yes' }
                  ].map(item => {
                    const isEnabled = selectedEmp[item.key] === item.val;
                    return (
                      <div key={item.key} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3 flex flex-col justify-between">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide block">{item.label}</span>
                        <button
                          type="button"
                          disabled={isClosed}
                          onClick={() => {
                            const newVal = isEnabled ? (typeof item.val === 'boolean' ? false : 'no') : item.val;
                            setSelectedEmp({ ...selectedEmp, [item.key]: newVal });
                          }}
                          className={`w-full py-2 text-[10px] font-black rounded-lg border transition-all outline-none ${
                            isEnabled 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-slate-200 text-slate-500 border-slate-350 hover:bg-slate-300'
                          }`}
                        >
                          {isEnabled ? 'SCHEME_ON' : 'SCHEME_OFF'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUB PANEL 3: Tax Declarations */}
            {inspectingTab === 'declarations' && (
              <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-sm text-slate-800">Financial Year Tax settings</h3>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400">Status:</span>
                    <select
                      value={declarations.status || 'Active'}
                      disabled={isClosed}
                      onChange={(e) => setDeclarations({ ...declarations, status: e.target.value })}
                      className={`px-2.5 py-1 border rounded-lg text-xs font-bold outline-none ${
                        declarations.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        declarations.status === 'Approved' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <option value="Active">Pending Verification</option>
                      <option value="Verified">Verified & Applied</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <span className="text-[10px] font-bold text-slate-400 ml-3">Regime:</span>
                    <select
                      value={selectedEmp.taxRegime || 'new'}
                      disabled={isClosed}
                      onChange={(e) => setSelectedEmp({ ...selectedEmp, taxRegime: e.target.value })}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none text-slate-700"
                    >
                      <option value="new">New Tax Regime</option>
                      <option value="old">Old Tax Regime</option>
                    </select>
                  </div>
                </div>

                {/* Old Regime Declarations editing */}
                {selectedEmp.taxRegime === 'old' ? (
                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-500 leading-normal">Declare deductions under Section 80C, 80D, and HRA Rent paid for annual tax exemptions.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Section 80C Limit (PPF, ELSS, LIC)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                          <input 
                            type="number" 
                            value={declarations.sections?.section80C?.total || 0}
                            disabled={isClosed}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setDeclarations({
                                ...declarations,
                                sections: {
                                  ...declarations.sections,
                                  section80C: { ...declarations.sections.section80C, total: val }
                                }
                              });
                            }}
                            className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Section 80D Health Insurance Limit</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                          <input 
                            type="number" 
                            value={declarations.sections?.section80D?.total || 0}
                            disabled={isClosed}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setDeclarations({
                                ...declarations,
                                sections: {
                                  ...declarations.sections,
                                  section80D: { ...declarations.sections.section80D, total: val }
                                }
                              });
                            }}
                            className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Annual Rent Paid (HRA Exemption)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                          <input 
                            type="number" 
                            value={declarations.sections?.hra?.annualRent || 0}
                            disabled={isClosed}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setDeclarations({
                                ...declarations,
                                sections: {
                                  ...declarations.sections,
                                  hra: { ...declarations.sections.hra, annualRent: val }
                                }
                              });
                            }}
                            className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">HRA City Tier</label>
                        <select
                          value={declarations.sections?.hra?.city || 'Non-Metro'}
                          disabled={isClosed}
                          onChange={(e) => setDeclarations({
                            ...declarations,
                            sections: {
                              ...declarations.sections,
                              hra: { ...declarations.sections.hra, city: e.target.value }
                            }
                          })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none text-slate-700"
                        >
                          <option value="Non-Metro">Non-Metro (40% Basic Salary ceiling)</option>
                          <option value="Metro">Metro (50% Basic Salary ceiling)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-center text-slate-500">
                    <Info className="h-6 w-6 mx-auto text-slate-400" />
                    <p className="text-xs font-bold text-slate-600">Standard Regime Activated</p>
                    <p className="text-[10px] max-w-sm mx-auto leading-normal">New Tax Regime only applies standard deduction (₹75,000) and employer NPS benefits. All exemptions under 80C, 80D, and HRA are disabled.</p>
                  </div>
                )}
              </div>
            )}

            {/* SUB PANEL 3.5: Uploaded Proof Documents */}
            {inspectingTab === 'uploaded-docs' && (
              <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm space-y-6 animate-in fade-in duration-200 font-sans">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-sm text-slate-800">Employee Uploaded Documents</h3>
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-extrabold px-2 py-0.5 rounded-full">
                    {uploadedDocs.length} Documents
                  </span>
                </div>

                {docsLoading ? (
                  <p className="text-xs text-slate-400 py-8 text-center animate-pulse">Loading documents...</p>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
                    {uploadedDocs.map(doc => {
                      const displayBadge = doc.category || 'Investment';
                      
                      return (
                        <div key={doc.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:bg-slate-50/10 px-2 rounded-xl transition-all">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[9px] font-extrabold uppercase border border-indigo-150 shadow-sm">
                                {displayBadge}
                              </span>
                              <span className="font-bold text-slate-850">Submitted Investment Proof</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-semibold">{doc.description}</p>
                            <span className="text-[9px] text-slate-400 block font-normal">Uploaded on {new Date(doc.submittedAt).toLocaleDateString()}</span>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 font-bold rounded-lg transition-all flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3 shrink-0" />
                              <span>View Document</span>
                            </a>

                            {doc.status === 'Approved' ? (
                              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-250 rounded-lg font-bold flex items-center gap-1">
                                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <span>Approved</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={isClosed}
                                onClick={() => handleApproveDoc(doc.id)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all shadow-sm"
                              >
                                Approve Document
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {uploadedDocs.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
                        <FileText className="h-8 w-8 text-slate-350" />
                        <p className="font-bold text-slate-550">No documents uploaded yet</p>
                        <p className="text-[10px] text-slate-450">Any investment proofs uploaded by the employee will appear here for verification.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SUB PANEL 4: Step-by-step Math log */}
            {inspectingTab === 'inspector' && (
              <CalculationInspector
                selectedEmp={selectedEmp}
                calcPreviewResult={calcPreviewResult}
                calcPreviewLogs={calcPreviewLogs}
                expandedLogStep={expandedLogStep}
                setExpandedLogStep={setExpandedLogStep}
                isInspecting={isInspecting}
                runCalculationInspection={runCalculationInspection}
              />
            )}

          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-4" />
            <h3 className="font-bold text-slate-800 text-base">No Employee Selected</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Search and select an employee from the roster panel on the left to configure structures and calculate taxes.</p>
          </div>
        )}

      </div>

    </div>
  );
}
