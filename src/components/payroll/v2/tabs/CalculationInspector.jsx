import React from 'react';
import { 
  ChevronRight, HelpCircle, Info, RotateCw, TrendingUp,
  Calendar, Briefcase, CheckCircle2, Clock, Coffee, Sun, FileText, AlertCircle 
} from 'lucide-react';

const renderStepVisualBreakdown = (stepNum, outputData) => {
  if (!outputData) return null;

  switch(stepNum) {
    case 4: // Attendance
      return (
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 font-sans space-y-4 text-xs mt-2">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <h4 className="font-extrabold text-indigo-700 uppercase text-[10px] tracking-wider">Attendance Summary</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Block 1: TOTAL DAYS */}
            <div className="flex items-center gap-3 bg-white p-3 border border-slate-150 rounded-xl">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Days</span>
                <span className="text-sm font-black text-slate-800 block">{outputData.payrollDays || 0}</span>
              </div>
            </div>

            {/* Block 2: WORKING DAYS */}
            <div className="flex items-center gap-3 bg-white p-3 border border-slate-150 rounded-xl">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Working Days</span>
                <span className="text-sm font-black text-slate-800 block">
                  {Math.max(0, (outputData.payrollDays || 0) - (outputData.weeklyOffs || 0) - (outputData.holidays !== undefined ? outputData.holidays : (outputData.holidayDays || 0)))}
                </span>
              </div>
            </div>

            {/* Block 3: PRESENT DAYS */}
            <div className="flex items-center gap-3 bg-white p-3 border border-slate-150 rounded-xl">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Present Days</span>
                <span className="text-sm font-black text-slate-800 block">{outputData.presentDays || 0}</span>
              </div>
            </div>

            {/* Block 4: HALF DAYS */}
            <div className="flex items-center gap-3 bg-white p-3 border border-slate-150 rounded-xl">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Half Days</span>
                <span className="text-sm font-black text-slate-800 block">{outputData.halfDays || 0}</span>
              </div>
            </div>

            {/* Block 5: WEEKLY OFFS */}
            <div className="flex items-center gap-3 bg-white p-3 border border-slate-150 rounded-xl">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Coffee className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Weekly Offs</span>
                <span className="text-sm font-black text-slate-800 block">{outputData.weeklyOffs || 0}</span>
              </div>
            </div>

            {/* Block 6: HOLIDAYS */}
            <div className="flex items-center gap-3 bg-white p-3 border border-slate-150 rounded-xl">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                <Sun className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Holidays</span>
                <span className="text-sm font-black text-slate-800 block">
                  {outputData.holidays !== undefined ? outputData.holidays : (outputData.holidayDays || 0)}
                </span>
              </div>
            </div>

            {/* Block 7: PAID LEAVES */}
            <div className="flex items-center gap-3 bg-white p-3 border border-slate-150 rounded-xl">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Paid Leaves</span>
                <span className="text-sm font-black text-slate-800 block">
                  {outputData.paidLeaves !== undefined ? outputData.paidLeaves : (outputData.paidLeaveDays || 0)}
                </span>
              </div>
            </div>

            {/* Block 8: LWP / UNPAID */}
            <div className="flex items-center gap-3 bg-white p-3 border border-slate-150 rounded-xl">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">LWP / Unpaid</span>
                <span className="text-sm font-black text-rose-600 block">{outputData.lopDays || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-200/60">
            <span>Net Payable Days: <strong className="text-indigo-600">{outputData.payableDays || 0} Days</strong></span>
            <span>Proration Factor: <strong className="font-mono">{(outputData.prorationFactor || 1).toFixed(4)}</strong></span>
          </div>
        </div>
      );

    case 9: // Gross Salary
      return (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-sans space-y-3 text-xs mt-2 animate-in fade-in duration-200">
          <h4 className="font-extrabold text-indigo-700 uppercase text-[10px] tracking-wider">Gross Payout Component Breakdown</h4>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase">
                  <th className="p-2">Salary Component</th>
                  <th className="p-2 text-right">Base Assigned</th>
                  <th className="p-2 text-right">Prorated Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {Object.keys(outputData.earningsBreakdown || {}).map(code => (
                  <tr key={code} className="hover:bg-slate-50/50">
                    <td className="p-2 font-bold text-slate-800">{code}</td>
                    <td className="p-2 text-right">₹{Number(outputData.earningsBreakdown[code] || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-2 text-right text-indigo-600 font-bold">₹{Number(outputData.proratedEarnings?.[code] || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t border-slate-200/60">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Variable Earnings</p>
              <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                <div className="flex justify-between bg-white px-2 py-1 rounded border border-slate-150">
                  <span className="text-slate-500">Bonus:</span>
                  <span className="font-bold text-slate-800">₹{Number(outputData.bonus?.amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between bg-white px-2 py-1 rounded border border-slate-150">
                  <span className="text-slate-500">Overtime:</span>
                  <span className="font-bold text-slate-800">₹{Number(outputData.overtime?.amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between bg-white px-2 py-1 rounded border border-slate-150">
                  <span className="text-slate-500">Arrears:</span>
                  <span className="font-bold text-slate-800">₹{Number(outputData.arrear?.amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between bg-white px-2 py-1 rounded border border-slate-150">
                  <span className="text-slate-500">Reimbursement:</span>
                  <span className="font-bold text-slate-800">₹{Number(outputData.reimbursements || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-end items-end space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total Gross Payout</span>
              <span className="text-xl font-black text-slate-900">₹{Number(outputData.totalEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      );

    case 10: // Statutory Deductions
      return (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-sans space-y-3 text-xs mt-2 animate-in fade-in duration-200">
          <h4 className="font-extrabold text-indigo-700 uppercase text-[10px] tracking-wider">Statutory Deductions (EPF, ESIC, PT, LWF)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outputData.pf && (outputData.pf.employeePF > 0 || outputData.pf.employerPF > 0) && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="font-black text-slate-800 text-[11px]">Employees' Provident Fund (EPF)</span>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                </div>
                <div className="space-y-1 text-[10.5px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Wage Base used:</span>
                    <span className="font-bold text-slate-800">₹{Number(outputData.pf.eligibleWages || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Employee Share (12%):</span>
                    <span className="font-extrabold text-rose-600">₹{Number(outputData.pf.employeePF || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Employer Share:</span>
                    <span className="font-semibold text-slate-700">₹{Number(outputData.pf.employerPF || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 border-t border-dashed border-slate-100 pt-1">
                    <span>Pension Scheme (EPS):</span>
                    <span>₹{Number(outputData.pf.eps || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}

            {outputData.esi && (outputData.esi.employeeESI > 0 || outputData.esi.employerESI > 0) && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="font-black text-slate-800 text-[11px]">Employee State Insurance (ESI)</span>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                </div>
                <div className="space-y-1 text-[10.5px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Wage Base used:</span>
                    <span className="font-bold text-slate-800">₹{Number(outputData.esi.eligibleWages || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Employee Share (0.75%):</span>
                    <span className="font-extrabold text-rose-600">₹{Number(outputData.esi.employeeESI || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Employer Share (3.25%):</span>
                    <span className="font-semibold text-slate-700">₹{Number(outputData.esi.employerESI || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}

            {outputData.pt && outputData.pt.ptAmount > 0 && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="font-black text-slate-800 text-[11px]">Professional Tax (PT)</span>
                  <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">State Rule</span>
                </div>
                <div className="space-y-1 text-[10.5px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Gross wages used:</span>
                    <span className="font-bold text-slate-800">₹{Number(outputData.pt.eligibleWages || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Deducted Amount:</span>
                    <span className="font-extrabold text-rose-600">₹{Number(outputData.pt.ptAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}

            {outputData.lwf && outputData.lwf.employeeAmount > 0 && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="font-black text-slate-800 text-[11px]">Labour Welfare Fund (LWF)</span>
                  <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">State Rule</span>
                </div>
                <div className="space-y-1 text-[10.5px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Employee Share:</span>
                    <span className="font-extrabold text-rose-600">₹{Number(outputData.lwf.employeeAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Employer Share:</span>
                    <span className="font-semibold text-slate-700">₹{Number(outputData.lwf.employerAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );

    case 11: // Tax (TDS) Slabs & Declarations
      return (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-sans space-y-4 text-xs mt-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="font-extrabold text-indigo-700 uppercase text-[10px] tracking-wider">Income Tax Projection & TDS Calculations</h4>
            <span className="px-2 py-0.5 text-[9px] rounded-full font-black bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase">
              {outputData.regime || 'NEW'} Tax Regime
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-white rounded-xl border border-slate-150 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Annual Projected Gross</span>
              <span className="text-base font-black text-slate-900">₹{Number(outputData.projectedAnnualIncome || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-150 space-y-1">
              <span className="text-[10px] text-rose-500 font-bold uppercase block">Total Allowed Deductions</span>
              <span className="text-base font-black text-rose-600">₹{Number(outputData.totalExemptions || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-150 space-y-1">
              <span className="text-[10px] text-indigo-700 font-bold uppercase block">Net Taxable Income</span>
              <span className="text-base font-black text-indigo-800">₹{Number(outputData.taxableIncome || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Investment Deductions List */}
          {outputData.exemptionBreakdown && Object.keys(outputData.exemptionBreakdown).length > 0 && (
            <div className="space-y-2">
              <h5 className="font-extrabold text-slate-700 text-[10px] uppercase">Declared Exemption Claims & Limits</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.keys(outputData.exemptionBreakdown).map(code => {
                  const item = outputData.exemptionBreakdown[code];
                  return (
                    <div key={code} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">Section {code}</span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Allowed: ₹{Number(item.allowed || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Declared: ₹{Number(item.declared || 0).toLocaleString('en-IN')}</span>
                        <span>Max Ceiling Limit: ₹{Number(item.maxLimit || 0).toLocaleString('en-IN')}</span>
                      </div>
                      {item.rule && (
                        <p className="text-[9px] text-slate-400 leading-normal border-t border-dashed border-slate-100 pt-1 font-mono">{item.rule}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Slab Breakdown Table */}
          {outputData.slabBreakdown && outputData.slabBreakdown.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-extrabold text-slate-700 text-[10px] uppercase">Slab-by-Slab Tax Application (Progressive)</h5>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse text-[10.5px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase">
                      <th className="p-2.5">Tax Slab Bounds</th>
                      <th className="p-2.5 text-center">Rate</th>
                      <th className="p-2.5 text-right">Taxable Amount</th>
                      <th className="p-2.5 text-right">Calculated Slab Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {outputData.slabBreakdown.map((slab, sidx) => (
                      <tr key={sidx} className="hover:bg-slate-50/50">
                        <td className="p-2.5">
                          {slab.to ? `₹${slab.from.toLocaleString('en-IN')} - ₹${slab.to.toLocaleString('en-IN')}` : `Above ₹${slab.from.toLocaleString('en-IN')}`}
                        </td>
                        <td className="p-2.5 text-center font-bold text-indigo-600">{slab.rate}%</td>
                        <td className="p-2.5 text-right">₹{Number(slab.taxableAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-bold text-slate-800">₹{Number(slab.taxAmount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Surcharge / Cess / Monthly Payout Math */}
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px]">
            <div>
              <span className="text-slate-500 block">Projected Annual Tax:</span>
              <strong className="text-slate-800">₹{Number(outputData.projectedAnnualTax || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Surcharge & Cess:</span>
              <strong className="text-slate-800">₹{Number((outputData.surcharge || 0) + (outputData.cess || 0)).toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Total Annual Liability:</span>
              <strong className="text-slate-800">₹{Number(outputData.totalTaxLiability || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Balance Payable Tax:</span>
              <strong className="text-indigo-600">₹{Number(outputData.balanceTax || 0).toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-t border-slate-200 pt-3">
            <div className="text-[10px] text-slate-400 leading-normal mb-2 md:mb-0">
              Tax Deductible Formula:<br/>
              <code>Monthly TDS = Balance Tax (₹{outputData.balanceTax || 0}) / Remaining Months ({outputData.remainingMonths || 1} months)</code>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Monthly TDS Applied</span>
              <span className="text-lg font-black text-rose-600">₹{Number(outputData.monthlyTDS || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      );

    case 12: // Other Deductions
      return (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-sans space-y-3 text-xs mt-2 animate-in fade-in duration-200">
          <h4 className="font-extrabold text-indigo-700 uppercase text-[10px] tracking-wider">Other Non-Statutory Deductions (Loans, Advances)</h4>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase">
                  <th className="p-2.5">Deduction Description</th>
                  <th className="p-2.5 text-right">Repayment Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-2.5">Active Loan EMIs recovery</td>
                  <td className="p-2.5 text-right font-bold text-rose-600">₹{Number(outputData.loanRecovery || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-2.5">Salary Advances recovery</td>
                  <td className="p-2.5 text-right font-bold text-rose-600">₹{Number(outputData.advanceRecovery || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-2.5">Manual Adjustments / Other Deductions override</td>
                  <td className="p-2.5 text-right font-bold text-rose-600">₹{Number(outputData.otherDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );

    case 13: // Net Pay Math Equation
      return (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl font-sans space-y-4 text-xs mt-2 animate-in fade-in duration-200">
          <h4 className="font-extrabold text-indigo-800 uppercase text-[10px] tracking-wider">Final Salary Settlement Calculations</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white p-3 rounded-xl border border-slate-150">
              <span className="text-[10px] text-slate-400 font-bold block">TOTAL EARNINGS (A)</span>
              <span className="text-sm font-black text-emerald-600">₹{Number(outputData.totalEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-150">
              <span className="text-[10px] text-slate-400 font-bold block">STATUTORY + TDS (B)</span>
              <span className="text-sm font-black text-rose-600">₹{Number((outputData.statutoryDeductions || 0) + (outputData.taxTDS || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-150">
              <span className="text-[10px] text-slate-400 font-bold block">OTHER DEDUCTIONS (C)</span>
              <span className="text-sm font-black text-rose-600">₹{Number(outputData.otherDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-md shadow-indigo-600/10">
              <span className="text-[10px] text-indigo-200 font-bold block">NET PAYABLE (A - B - C)</span>
              <span className="text-sm font-black">₹{Number(outputData.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-center space-x-2 text-[10.5px] text-slate-600">
            <Info className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
            <p>
              The employee net salary is fully resolved. Once finalized, a payment file will be compiled containing <strong>₹{Number(outputData.netSalary || 0).toLocaleString('en-IN')}</strong> instruction.
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
};

const calculationSteps = [
  { step: 1, name: "Load Employee", desc: "Instantiate profile records, workState, and statutory eligibilities." },
  { step: 2, name: "Load Salary Structure", desc: "Load active base salary template and overrides." },
  { step: 3, name: "Load Payroll Month", desc: "Resolve fiscal year, total calendar days, and remaining tax months." },
  { step: 4, name: "Load Attendance", desc: "Calculate payable, present, weekly offs, and LOP days from logs." },
  { step: 5, name: "Load Payroll Rules", desc: "Fetch formula definitions and component dependencies." },
  { step: 6, name: "Load Statutory Rules", desc: "Identify ceilings, rates, and thresholds for EPF, ESIC, LWF, PT." },
  { step: 7, name: "Load Tax Rules", desc: "Load active regimes, tax sections, exemptions, and investment declarations." },
  { step: 8, name: "Calculate Earnings", desc: "Prorate basic salary and evaluate formula-driven allowances." },
  { step: 9, name: "Calculate Gross Salary", desc: "Compute total earnings (Prorated Gross + Overtime + Arrears + Bonus)." },
  { step: 10, name: "Calculate Statutory Deductions", desc: "Deduct employee EPF, ESIC, PT, and LWF." },
  { step: 11, name: "Calculate Tax (TDS)", desc: "Project annual income, apply standard deduction & declarations, evaluate tax slabs." },
  { step: 12, name: "Calculate Other Deductions", desc: "Deduct loan EMI repayments, salary advances, and other adjustments." },
  { step: 13, name: "Calculate Net Salary", desc: "Net Payable = Total Earnings - Statutory Deductions - Tax - Other Deductions." },
  { step: 14, name: "Generate Payslip", desc: "Lock calculation logs, construct payslip items, and serialize result." }
];

export default function CalculationInspector({
  selectedEmp,
  calcPreviewResult,
  calcPreviewLogs = [],
  expandedLogStep,
  setExpandedLogStep,
  isInspecting,
  runCalculationInspection
}) {
  return (
    <div className="space-y-6">
      {/* Run inspector trigger button in header if not already run */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="font-extrabold text-sm text-slate-850">Calculation Math Log Inspector</h3>
          <p className="text-xs text-slate-500 mt-0.5">Execute formula calculations and view a step-by-step mathematical audit log.</p>
        </div>
        <button
          onClick={runCalculationInspection}
          disabled={isInspecting}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 disabled:opacity-50"
        >
          {isInspecting ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
          <span>{isInspecting ? 'Running math...' : 'Run Calculator Inspector'}</span>
        </button>
      </div>

      {calcPreviewResult ? (
        <div className="space-y-6 font-sans">
          
          {/* Summary breakdown card */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-150">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Incurred Gross Earnings</span>
              <span className="text-sm font-black text-slate-800">₹{Number(calcPreviewResult.grossEarnings || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-150">
              <span className="text-[10px] text-rose-500 font-bold block uppercase">Statutory Deductions</span>
              <span className="text-sm font-black text-rose-600">-₹{Number(calcPreviewResult.totalStatutory || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-150">
              <span className="text-[10px] text-rose-500 font-bold block uppercase">Income Tax TDS</span>
              <span className="text-sm font-black text-rose-600">-₹{Number(calcPreviewResult.monthlyTDS || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-150">
              <span className="text-[10px] text-indigo-700 font-bold block uppercase">Resolved Net Take-Home</span>
              <span className="text-sm font-black text-indigo-800">₹{Number(calcPreviewResult.netSalary || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Stepper details timeline */}
          <div className="space-y-2.5">
            {calculationSteps.map(step => {
              const log = calcPreviewLogs.find(l => l.stepNumber === step.step);
              const isExpanded = expandedLogStep === step.step;
              return (
                <div key={step.step} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <div 
                    onClick={() => setExpandedLogStep(isExpanded ? null : step.step)}
                    className="p-3.5 bg-slate-50/50 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] border ${
                        log?.status === 'SUCCESS' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : log?.status === 'ERROR'
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}>
                        {step.step}
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-800 text-[11px]">{step.name}</p>
                        <span className="text-[9.5px] text-slate-400 leading-none">{step.desc}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-right">
                      {log?.outputValue !== null && log?.outputValue !== undefined && (
                        <span className="font-bold text-slate-900">₹{Number(log.outputValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      )}
                      <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {isExpanded && log && (
                    <div className="p-4 bg-white border-t border-slate-200 space-y-4 text-[11px] text-slate-650 font-mono">
                      {renderStepVisualBreakdown(step.step, log.outputData)}
                      
                      <div>
                        <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Formula & Math</span>
                        <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800 whitespace-pre-wrap">{log.formulaUsed}</p>
                      </div>

                      {log.inputValues && Object.keys(log.inputValues).length > 0 && (
                        <div>
                          <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Inputs</span>
                          <pre className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-750 text-[10px] overflow-x-auto">
                            {JSON.stringify(log.inputValues, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.outputData && (
                        <div>
                          <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Tax / Calculations Breakdown</span>
                          <pre className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-750 text-[10px] overflow-x-auto">
                            {JSON.stringify(log.outputData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 bg-slate-50 rounded-2xl text-center space-y-2 border border-dashed border-slate-200">
          <HelpCircle className="h-8 w-8 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-700">No Calculation Executed</p>
          <p className="text-[10px] text-slate-500 max-w-xs mx-auto">Click "Run Calculator Inspector" at the top to run formula calculations and view full step-by-step logs.</p>
        </div>
      )}
    </div>
  );
}
