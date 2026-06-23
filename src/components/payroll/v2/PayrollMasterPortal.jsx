"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  CreditCard, 
  Clock, 
  CheckSquare, 
  MessageSquare, 
  Settings2, 
  TrendingUp, 
  Users, 
  FileText, 
  AlertCircle,
  CheckCircle2, 
  ArrowRight, 
  Send, 
  ChevronRight,
  Download,
  AlertTriangle,
  RotateCw,
  Plus,
  Search,
  HelpCircle,
  Save,
  FileSpreadsheet,
  List,
  ArrowLeft,
  Info,
  Calendar,
  ShieldCheck,
  UserCheck,
  X,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const renderStepVisualBreakdown = (stepNum, outputData) => {
  if (!outputData) return null;

  switch(stepNum) {
    case 4: // Attendance
      return (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-sans space-y-3 text-xs mt-2">
          <h4 className="font-extrabold text-indigo-700 uppercase text-[10px] tracking-wider">Attendance Parameters Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-2.5 bg-white rounded-lg border border-slate-150">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Payroll Days</span>
              <span className="text-sm font-black text-slate-800">{outputData.payrollDays || 0} Days</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-150">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Present Days</span>
              <span className="text-sm font-black text-slate-800">{outputData.presentDays || 0} Days</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-150">
              <span className="text-[10px] text-rose-500 uppercase font-bold block">LOP Days (Unpaid)</span>
              <span className="text-sm font-black text-rose-600">{outputData.lopDays || 0} Days</span>
            </div>
            <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-150">
              <span className="text-[10px] text-indigo-700 uppercase font-bold block">Net Payable Days</span>
              <span className="text-sm font-black text-indigo-800">{outputData.payableDays || 0} Days</span>
            </div>
          </div>
          <div className="flex gap-4 text-[10px] text-slate-500">
            <span>Paid Leaves: <strong>{outputData.paidLeaveDays || 0}</strong></span>
            <span>Holidays: <strong>{outputData.holidayDays || 0}</strong></span>
            <span>Proration Factor: <strong>{(outputData.prorationFactor || 1).toFixed(4)}</strong></span>
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
        throw new Error(`The endpoint ${url} was not found (404). This usually happens because Next.js dev server has cached the routes. Please restart your development server (npm run dev) to load the new V2 endpoints.`);
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
        throw new Error("Server returned HTML page (possibly 404 or auth redirect) instead of JSON. Try restarting your dev server to refresh Next.js routes.");
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
  const [inspectingTab, setInspectingTab] = useState(null);
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

  // Filter states for employee structures list
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [activeDraftEmployee, setActiveDraftEmployee] = useState(null);

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

  const [selectedTemplateId, setSelectedTemplateId] = useState('');

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

      // 1. Save main employee V2 structure assignment (POST)
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
      
      // 2. Save investment declarations (POST)
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
      
      // Reload matching details
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
          month: new Date().getMonth() + 1, // current month
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

  const fetchActiveRuns = async () => {
    try {
      const data = await safeFetchJson('/api/v1/admin/payroll/v2/runs');
      if (data.success) {
        setRuns(data.runs);
        if (data.runs.length > 0) {
          loadRunDetails(data.runs[0].id);
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
        fetchActiveRuns();
      } else {
        toast.error(data.error || 'Failed to initialize run');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to process request');
    }
  };

  const triggerCalculations = async () => {
    if (!activeRun) return;
    setCalculating(true);
    try {
      const data = await safeFetchJson(`/api/v1/admin/payroll/v2/runs/${activeRun.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (data.success) {
        toast.success(`Calculated. Success: ${data.summary.success}, Errors: ${data.summary.errors}`);
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
    setActiveDraftEmployee(null); 
    setActiveTab('salary-structures'); 
    setInspectingTab('inspector');
    setIsInspecting(true);
    try {
      // 1. Fetch details
      const empData = await safeFetchJson(`/api/v1/admin/payroll/employees/${employeeId}`);
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
      setIsInspecting(false);
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

  // Filtered employees for structures list
  const filteredEmployees = allEmployees.filter(emp => {
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    const code = (emp.employeeId || '').toLowerCase();
    const matchSearch = fullName.includes(searchQuery.toLowerCase()) || code.includes(searchQuery.toLowerCase());
    const matchDept = !selectedDept || emp.department === selectedDept;
    return matchSearch && matchDept;
  });

  const departments = Array.from(new Set(allEmployees.map(e => e.department).filter(Boolean)));

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

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-8 bg-slate-50 text-slate-800 font-sans min-h-[calc(100vh-80px)]">

          {/* ────────────────────────────────────────────────────── */}
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {/* ────────────────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { title: "Total Payroll Cost", value: activeRun ? `₹${Number(activeRun.totalGross || 0).toLocaleString('en-IN')}` : "₹0", icon: CreditCard, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
                  { title: "Net Disbursement", value: activeRun ? `₹${Number(activeRun.totalNet || 0).toLocaleString('en-IN')}` : "₹0", icon: TrendingUp, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
                  { title: "Employees Processed", value: activeRun ? `${activeRun.processedEmployees || 0}/${runEmployees.length}` : "0/0", icon: Users, color: "text-blue-600 bg-blue-50 border-blue-100" },
                  { title: "Pending Queries", value: queries.filter(q => q.status === 'OPEN').length.toString(), icon: MessageSquare, color: "text-rose-600 bg-rose-50 border-rose-100" },
                ].map((card, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.title}</p>
                      <h3 className="text-2xl font-black text-slate-900">{card.value}</h3>
                    </div>
                    <div className={`p-3 rounded-xl border ${card.color}`}>
                      <card.icon className="h-6 w-6" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Pipeline Timeline */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Active Payroll Pipeline</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeRun ? `Month: ${activeRun.month}/${activeRun.year} • Code: ${activeRun.runCode}` : 'No active payroll run'}
                    </p>
                  </div>
                  {activeRun && (
                    <button
                      onClick={() => setActiveTab('payroll-run')}
                      className="text-xs font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
                    >
                      <span>Launch Wizard</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {activeRun && (
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {[
                      { step: 1, name: "1. Load & Open", active: activeRun.currentStep >= 1, current: activeRun.currentStep === 1 },
                      { step: 2, name: "2. Calculation", active: activeRun.currentStep >= 2, current: activeRun.currentStep === 2 },
                      { step: 3, name: "3. Approval Chain", active: activeRun.currentStep >= 3, current: activeRun.currentStep === 3 },
                      { step: 4, name: "4. Lock Totals", active: activeRun.currentStep >= 4, current: activeRun.currentStep === 4 },
                      { step: 5, name: "5. Release Slips", active: activeRun.currentStep >= 5, current: activeRun.currentStep === 5 },
                      { step: 6, name: "6. Bank Transfer", active: activeRun.currentStep >= 6, current: activeRun.currentStep === 6 },
                      { step: 7, name: "7. Closed", active: activeRun.status === 'CLOSED', current: activeRun.status === 'CLOSED' },
                    ].map(step => (
                      <div 
                        key={step.step}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          step.current 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10' 
                            : step.active 
                              ? 'bg-indigo-50 border-indigo-100 text-indigo-700 font-semibold' 
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <span className="text-xs font-bold block">{step.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {!activeRun && (
                  <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                    <form onSubmit={startNewRun} className="max-w-md mx-auto flex items-end gap-4 justify-center">
                      <div className="text-left space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Month</label>
                        <select name="month" className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none">
                          <option value="6">June</option>
                          <option value="7">July</option>
                          <option value="8">August</option>
                        </select>
                      </div>
                      <div className="text-left space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Year</label>
                        <select name="year" className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none">
                          <option value="2026">2026</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="h-4 w-4" />
                        Open New Run
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Bottom split: Disputes desk & Workflow Steps */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Employee dispute queue */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-sm text-slate-900">Employee Disputes Desk</h3>
                    <button onClick={() => setActiveTab('queries')} className="text-xs text-indigo-600 font-bold hover:underline">View All</button>
                  </div>
                  <div className="space-y-3">
                    {queries.slice(0, 3).map(q => (
                      <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-xs text-slate-800">{q.subject}</p>
                          <span className="text-[10px] text-slate-500">{q.employeeName} • Category: {q.category}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] rounded-full font-bold ${q.status === 'OPEN' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {q.status}
                        </span>
                      </div>
                    ))}
                    {queries.length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4">No active employee queries found.</p>
                    )}
                  </div>
                </div>

                {/* Approvals queue */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-sm text-slate-900">Pending Workflow Steps</h3>
                    <button onClick={() => setActiveTab('approvals')} className="text-xs text-indigo-600 font-bold hover:underline">Review Panel</button>
                  </div>
                  <div className="space-y-3">
                    {pendingApprovals.slice(0, 3).map(item => (
                      <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-xs text-slate-800">Verify Run: {item.entityCode}</p>
                          <span className="text-[10px] text-slate-500">Initiated: {new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className="px-2 py-0.5 text-[9px] rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Review Required
                        </span>
                      </div>
                    ))}
                    {pendingApprovals.length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4">No pending workflow requests in your queue.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ────────────────────────────────────────────────────── */}
          {/* TAB 2: MONTHLY RUN WIZARD */}
          {/* ────────────────────────────────────────────────────── */}
          {activeTab === 'payroll-run' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payroll Processing Wizard</h1>
                <p className="text-slate-500 text-sm mt-0.5">Execute formula engine calculations, apply variable component inputs, audit, and finalize payouts.</p>
              </div>

              {!activeRun ? (
                <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center space-y-4 shadow-sm">
                  <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
                  <h3 className="font-bold text-lg text-slate-800">No Active Payroll Run</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">Open a payroll run from the Dashboard Command Center to launch the processing wizard.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left Column: Workflow Actions */}
                  <div className="lg:col-span-1 space-y-6">
                    
                    {/* Status card */}
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
                      <h3 className="font-extrabold text-sm text-slate-800">Current Step Actions</h3>
                      
                      <div className="space-y-3.5 py-2">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <p className="text-xs font-bold text-slate-500">Processing Stage</p>
                          <p className="text-sm font-extrabold text-indigo-600 capitalize mt-0.5">{activeRun.status.replace(/_/g, ' ')}</p>
                        </div>
                      </div>

                      {/* Dynamic Stepper buttons */}
                      <div className="space-y-3">
                        {activeRun.status === 'OPEN' && (
                          <button
                            onClick={triggerCalculations}
                            disabled={calculating}
                            className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
                          >
                            <RotateCw className={`h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
                            <span>{calculating ? 'Calculating...' : 'Run Component Formulas'}</span>
                          </button>
                        )}

                        {activeRun.status === 'PREVIEW' && (
                          <div className="space-y-2">
                            <button
                              onClick={() => handleRunAction('SUBMIT_APPROVAL')}
                              className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
                            >
                              <Send className="h-4 w-4" />
                              <span>Submit for Multi-level Approval</span>
                            </button>
                            <button
                              onClick={triggerCalculations}
                              disabled={calculating}
                              className="w-full flex items-center justify-center space-x-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-sm rounded-xl transition-all shadow-sm"
                            >
                              <RotateCw className={`h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
                              <span>{calculating ? 'Recalculating...' : 'Recalculate Formulas'}</span>
                            </button>
                          </div>
                        )}

                        {(activeRun.status.includes('APPROVAL') || activeRun.status === 'FINANCE_APPROVAL') && (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-center">
                            <Clock className="h-5 w-5 text-amber-500 mx-auto animate-pulse" />
                            <p className="text-xs font-bold text-slate-700">Under Review</p>
                            <p className="text-[10px] text-slate-500">Currently awaiting approvals in the workflow queue. Go to Workflow Approvals tab to review.</p>
                            <button
                              onClick={() => handleRunAction('LOCK')}
                              className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
                            >
                              (Bypass Approval & Lock Run)
                            </button>
                          </div>
                        )}

                        {activeRun.status === 'LOCKED' && (
                          <button
                            onClick={() => handleRunAction('RELEASE_PAYSLIPS')}
                            className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Publish Payslips to Portals</span>
                          </button>
                        )}

                        {activeRun.status === 'PAYSLIPS_GENERATED' && (
                          <button
                            onClick={() => handleRunAction('GENERATE_BANK_FILE')}
                            className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
                          >
                            <Download className="h-4 w-4" />
                            <span>Compile & Download Bank CSV</span>
                          </button>
                        )}

                        {activeRun.status === 'BANK_FILE_GENERATED' && (
                          <button
                            onClick={() => handleRunAction('CLOSE')}
                            className="w-full flex items-center justify-center space-x-2 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Lock Database & Close Run</span>
                          </button>
                        )}

                        {activeRun.status === 'CLOSED' && (
                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
                            <p className="text-xs font-extrabold text-emerald-700">Run Successfully Finalized</p>
                            <p className="text-[10px] text-slate-500">All data locked. Payslips released and compliance files compiled.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Run audit trail */}
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
                      <h3 className="font-extrabold text-sm text-slate-800">Run Audit Trail</h3>
                      <div className="space-y-4 overflow-y-auto max-h-60 pr-2">
                        {Array.isArray(activeRun.runLog) && activeRun.runLog.map((log, lidx) => (
                          <div key={lidx} className="flex items-start space-x-3 text-xs">
                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            <div className="space-y-0.5">
                              <p className="text-slate-700 font-bold">{log.action}</p>
                              <p className="text-[10px] text-slate-500">{log.message}</p>
                              <span className="text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()} • {log.userName}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Employee Table details */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="font-extrabold text-sm text-slate-800">Wages Summary</h3>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Total Employees: {runEmployees.length}</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 bg-slate-50/50">
                              <th className="p-4">Employee</th>
                              <th className="p-4 text-center">Attendance Ratio</th>
                              <th className="p-4 text-center">Leaves Taken</th>
                              <th className="p-4 text-center">LOP Days</th>
                              <th className="p-4 text-right">Gross Earnings</th>
                              <th className="p-4 text-right">Deductions</th>
                              <th className="p-4 text-right">Net Payout</th>
                              <th className="p-4 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-xs">
                            {runEmployees.map(re => (
                              <tr 
                                key={re.id} 
                                onClick={() => setActiveDraftEmployee(re)}
                                className="hover:bg-indigo-50/40 cursor-pointer transition-all"
                              >
                                <td className="p-4">
                                  <div>
                                    <p className="font-extrabold text-slate-800">{re.firstName} {re.lastName}</p>
                                    <span className="text-[10px] text-slate-400 font-medium">{re.employeeCode} • {re.designation}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-center text-slate-600 font-semibold">
                                  {re.presentDays || 0}/{re.payrollDays || 0}
                                </td>
                                <td className="p-4 text-center text-slate-600 font-medium">
                                  {re.paidLeaves || 0} days
                                </td>
                                <td className="p-4 text-center text-rose-600 font-bold">
                                  {re.lopDays || 0} days
                                </td>
                                <td className="p-4 text-right font-semibold text-slate-800">
                                  ₹{Number(re.totalEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-4 text-right text-rose-600 font-semibold">
                                  -₹{Number(re.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-4 text-right font-black text-emerald-600">
                                  ₹{Number(re.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`px-2 py-0.5 text-[9px] rounded-full font-bold border ${
                                    re.status === 'CALCULATED' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : re.status === 'ERROR'
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                  }`}>
                                    {re.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* ────────────────────────────────────────────────────── */}
          {/* TAB 3: SALARY STRUCTURES & TAX CALCULATOR */}
          {/* ────────────────────────────────────────────────────── */}
          {activeTab === 'salary-structures' && (
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                    >
                      <option value="">All Departments...</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  {/* Employees list */}
                  <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
                    {filteredEmployees.map(emp => (
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
                            <p className="font-bold text-xs text-slate-800">{emp.personalDetails?.firstName} {emp.personalDetails?.lastName}</p>
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
                </div>

                {/* Selected Summary Card */}
                {selectedEmp && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center space-x-3.5 pb-3 border-b border-slate-100">
                      <div className="h-10 w-10 bg-indigo-100 text-indigo-700 font-black rounded-full flex items-center justify-center">
                        {selectedEmp.personalDetails?.firstName?.[0]}
                      </div>
                      <div>
                        <p className="font-extrabold text-xs text-slate-900">{selectedEmp.personalDetails?.firstName} {selectedEmp.personalDetails?.lastName}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{selectedEmp.jobDetails?.designation}</p>
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
                    
                    {/* Header Setup Actions */}
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h2 className="text-base font-black text-slate-900">Payroll parameters & overrides</h2>
                        <p className="text-[10px] text-slate-500">Adjust compensation structures, toggle statutory schemes, and declare investment proofs.</p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={runCalculationInspection}
                          disabled={isInspecting}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                        >
                          {isInspecting ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
                          <span>{isInspecting ? 'Running math...' : 'Run Calculator Inspector'}</span>
                        </button>

                        <button
                          onClick={handleSaveEmpPayrollSettings}
                          disabled={empSaving}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                        >
                          {empSaving ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          <span>Save Settings</span>
                        </button>
                      </div>
                    </div>

                    {/* Section Switcher Tabs */}
                    <div className="flex border-b border-slate-200 gap-6">
                      {[
                        { id: 'structure', name: 'Compensation Details' },
                        { id: 'statutory', name: 'Statutory applicability' },
                        { id: 'declarations', name: 'Tax Slabs & Declarations' },
                        { id: 'inspector', name: 'Step-by-step math log' }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setInspectingTab(t.id)}
                          className={`pb-3 text-xs font-bold border-b-2 transition-all outline-none ${
                            (inspectingTab || 'structure') === t.id
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>

                    {/* SUB PANEL 1: Compensation override */}
                    {(inspectingTab || 'structure') === 'structure' && (
                      <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm space-y-8 animate-in fade-in duration-200 font-sans">
                        
                        {/* Row 1: Base settings & templates */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-slate-100">
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-850">Salary Configurator & Component Master</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Customize allowances, deductions, and wage parameters for this employee.</p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Apply Template:</label>
                            <select
                              value={selectedTemplateId}
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
                                    toast.success(`Loaded template '${template.name}' components!`);
                                  }
                                }
                              }}
                              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                            >
                              <option value="">Select Template...</option>
                              {salaryTemplates.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.employeeType})</option>
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
                            {masterComponents.filter(m => m.category === 'EARNING' && m.code !== 'BASIC').map(master => {
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
                    {(inspectingTab || 'structure') === 'statutory' && (
                      <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm space-y-6 animate-in fade-in duration-200">
                        <h3 className="font-extrabold text-sm text-slate-800 pb-2 border-b border-slate-100">Statutory Scheme Applicabilities</h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: 'PF Applicable', key: 'pfApplicable', val: 'yes' },
                            { label: 'ESIC Applicable', key: 'esicApplicable', val: 'yes' },
                            { label: 'TDS (Tax) Deductions', key: 'isTDSApplicable', val: true },
                            { label: 'Gratuity Scheme', key: 'gratuityApplicable', val: 'yes' }
                          ].map(item => {
                            const isEnabled = selectedEmp[item.key] === item.val;
                            return (
                              <div key={item.key} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3 flex flex-col justify-between">
                                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide block">{item.label}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newVal = isEnabled ? (typeof item.val === 'boolean' ? false : 'no') : item.val;
                                    setSelectedEmp({ ...selectedEmp, [item.key]: newVal });
                                  }}
                                  className={`w-full py-2 text-[10px] font-black rounded-lg border transition-all ${
                                    isEnabled 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : 'bg-slate-200 text-slate-500 border-slate-350'
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
                    {(inspectingTab || 'structure') === 'declarations' && (
                      <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm space-y-6 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <h3 className="font-extrabold text-sm text-slate-800">Financial Year Tax settings</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold text-slate-400">Status:</span>
                            <select
                              value={declarations.status || 'Active'}
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
                              onChange={(e) => setSelectedEmp({ ...selectedEmp, taxRegime: e.target.value })}
                              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
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
                                  onChange={(e) => setDeclarations({
                                    ...declarations,
                                    sections: {
                                      ...declarations.sections,
                                      hra: { ...declarations.sections.hra, city: e.target.value }
                                    }
                                  })}
                                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none"
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

                    {/* SUB PANEL 4: Step-by-step Math log */}
                    {(inspectingTab || 'structure') === 'inspector' && (
                      <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm space-y-6 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <h3 className="font-extrabold text-sm text-slate-800">Calculation Execution Logs</h3>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Master 14-Step Orchestrator</span>
                        </div>

                        {calcPreviewResult ? (
                          <div className="space-y-4">
                            <div className="p-4 bg-indigo-50 border border-indigo-150 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
                              <div>
                                <p className="font-bold">Calculated successfully!</p>
                                <p className="text-[10px] text-indigo-700 mt-0.5">Execution time: {calcPreviewResult.calculationLogs?.totalExecutionMs || 0}ms</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black">Net Pay: ₹{Number(calcPreviewResult.netSalary || 0).toLocaleString('en-IN')}</p>
                              </div>
                            </div>

                            {/* Stepper details timeline */}
                            <div className="space-y-2.5">
                              {calculationSteps.map(step => {
                                const log = calcPreviewLogs.find(l => l.stepNumber === step.step);
                                const isExpanded = expandedLogStep === step.step;
                                return (
                                  <div key={step.step} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
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
                                          <p className="font-extrabold text-slate-800">{step.name}</p>
                                          <span className="text-[9px] text-slate-400">{step.desc}</span>
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
                                      <div className="p-4 bg-white border-t border-slate-200 space-y-3 text-[11px] text-slate-600 font-mono">
                                        {renderStepVisualBreakdown(step.step, log.outputData)}
                                        <div>
                                          <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Formula & Math</span>
                                          <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800 whitespace-pre-wrap">{log.formulaUsed}</p>
                                        </div>

                                        {log.inputValues && Object.keys(log.inputValues).length > 0 && (
                                          <div>
                                            <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Inputs</span>
                                            <pre className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700 text-[10px] overflow-x-auto">
                                              {JSON.stringify(log.inputValues, null, 2)}
                                            </pre>
                                          </div>
                                        )}

                                        {log.outputData && (
                                          <div>
                                            <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Tax / Calculations Breakdown</span>
                                            <pre className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700 text-[10px] overflow-x-auto">
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
          )}

          {/* ────────────────────────────────────────────────────── */}
          {/* TAB 4: TWO-WAY QUERIES RESOLUTION DESK */}
          {/* ────────────────────────────────────────────────────── */}
          {activeTab === 'queries' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Left Panel: Query List */}
              <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-12rem)] shadow-sm">
                <div className="p-5 border-b border-slate-100 space-y-3 bg-slate-50/50">
                  <h3 className="font-extrabold text-sm flex items-center space-x-2 text-slate-900">
                    <MessageSquare className="h-4.5 w-4.5 text-indigo-600" />
                    <span>Dispute & Query Desk</span>
                  </h3>
                  <div className="flex items-center space-x-2">
                    {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setQueryFilter(filter)}
                        className={`px-2.5 py-1 text-[10px] rounded-lg font-bold border transition-all ${
                          queryFilter === filter
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-white text-slate-500 border-slate-200 hover:text-indigo-600'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-2 bg-slate-50/20">
                  {queries
                    .filter(q => queryFilter === 'ALL' || q.status === queryFilter)
                    .map(q => (
                      <div
                        key={q.id}
                        onClick={() => setSelectedQuery(q)}
                        className={`p-4 rounded-xl cursor-pointer transition-all border ${
                          selectedQuery?.id === q.id
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                            : 'bg-white border-slate-200/60 hover:border-slate-350'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-xs text-slate-800">{q.subject}</h4>
                          <span className={`px-2 py-0.5 text-[9px] rounded-full font-bold border ${
                            q.status === 'OPEN' 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : q.status === 'RESOLVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {q.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{q.description}</p>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 mt-2">
                          <span>{q.employeeName} ({q.employeeCode})</span>
                          <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  {queries.length === 0 && (
                    <p className="text-xs text-slate-500 py-8 text-center">No ticket threads found.</p>
                  )}
                </div>
              </div>

              {/* Right Panel: Chat/Details */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl flex flex-col h-[calc(100vh-12rem)] overflow-hidden shadow-sm">
                {selectedQuery ? (
                  <>
                    {/* Header info */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">ticket details</span>
                        <h3 className="font-extrabold text-base text-slate-900 mt-0.5">{selectedQuery.subject}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Raised by: {selectedQuery.employeeName} • Priority: {selectedQuery.priority}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {selectedQuery.status !== 'RESOLVED' ? (
                          <button
                            onClick={() => resolveQuery('RESOLVED')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                          >
                            Mark Resolved
                          </button>
                        ) : (
                          <button
                            onClick={() => resolveQuery('OPEN')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all"
                          >
                            Re-Open Ticket
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Chat Messages flow */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/10">
                      {selectedQuery.comments?.map(comment => {
                        const isAdmin = comment.commentByRole === 'ADMIN' || comment.commentByRole === 'HR' || comment.commentByRole === 'FINANCE';
                        return (
                          <div 
                            key={comment.id}
                            className={`flex flex-col max-w-[80%] rounded-2xl p-4 shadow-sm border ${
                              isAdmin 
                                ? 'bg-indigo-50 border-indigo-100 self-end ml-auto' 
                                : 'bg-white border-slate-200 self-start mr-auto'
                            }`}
                          >
                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wide border-b border-slate-100 pb-1 mb-2">
                              <span>{comment.commentByName} ({comment.commentByRole})</span>
                              <span>{new Date(comment.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-normal">{comment.message}</p>
                          </div>
                        );
                      })}
                      {selectedQuery.comments?.length === 0 && (
                        <p className="text-xs text-slate-500 py-6 text-center">No replies in this query thread yet.</p>
                      )}
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={postCommentReply} className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center space-x-3">
                      <input
                        type="text"
                        placeholder="Type query reply message..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/15"
                      />
                      <button
                        type="submit"
                        disabled={replyLoading || !newComment.trim()}
                        className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-sm"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="m-auto text-center space-y-2">
                    <MessageSquare className="h-10 w-10 text-slate-300 mx-auto" />
                    <h3 className="font-bold text-slate-800 text-sm">No Thread Selected</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">Select an employee query thread from the side panel to view messages and post replies.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ────────────────────────────────────────────────────── */}
          {/* TAB 5: WORKFLOW APPROVALS DESK */}
          {/* ────────────────────────────────────────────────────── */}
          {activeTab === 'approvals' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pending Workflow Approvals</h1>
                <p className="text-slate-500 text-sm mt-0.5">Review, verify, and action monthly payroll processes or structural adjustment overrides.</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {pendingApprovals.map(approval => (
                  <div key={approval.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                    
                    <div className="lg:col-span-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 text-[9px] font-black tracking-widest rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {approval.workflowType}
                        </span>
                        <span className="text-[10px] text-slate-400">Initiated: {new Date(approval.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">Run Reference: {approval.entityCode}</h3>
                      <p className="text-xs text-slate-500">Currently awaiting Level {approval.currentLevel} approval step assigned to your role queue.</p>
                    </div>

                    <div className="lg:col-span-1 text-left space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Decision Remarks</label>
                      <input 
                        type="text" 
                        placeholder="Add decision comments..." 
                        value={decisionComments[approval.stepId] || ''}
                        onChange={(e) => setDecisionComments({
                          ...decisionComments,
                          [approval.stepId]: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                      />
                    </div>

                    <div className="lg:col-span-1 flex items-center justify-end space-x-3 shrink-0">
                      <button
                        onClick={() => processApprovalDecision(approval.id, approval.stepId, 'REJECT')}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => processApprovalDecision(approval.id, approval.stepId, 'APPROVE')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                      >
                        Approve Step
                      </button>
                    </div>

                  </div>
                ))}
                
                {pendingApprovals.length === 0 && (
                  <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center space-y-3 shadow-sm">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                    <h3 className="font-bold text-slate-800 text-sm">No Pending Approvals</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">All payroll workflow steps have been processed. Great job!</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ────────────────────────────────────────────────────── */}
          {/* TAB 6: MASTER SETTINGS */}
          {/* ────────────────────────────────────────────────────── */}
          {activeTab === 'configs' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Sub-navigation Tabs */}
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setConfigSubTab('components')}
                  className={`py-3 px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
                    configSubTab === 'components'
                      ? 'border-indigo-600 text-indigo-600 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Salary Component Master
                </button>
                <button
                  type="button"
                  onClick={() => setConfigSubTab('workflows')}
                  className={`py-3 px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
                    configSubTab === 'workflows'
                      ? 'border-indigo-600 text-indigo-600 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Approval Workflows
                </button>
              </div>

              {configSubTab === 'workflows' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Create Config */}
                  <div className="bg-white border border-slate-200 p-8 rounded-2xl space-y-6 shadow-sm">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">Workflow Level Configurations</h3>
                      <p className="text-xs text-slate-500 mt-1">Configure customized multi-level approval hierarchies for specific operational entities.</p>
                    </div>

                    <form onSubmit={saveWorkflowConfig} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Workflow Module</label>
                        <select name="type" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:bg-white outline-none">
                          <option value="PAYROLL_RUN">PAYROLL_RUN (Monthly Process)</option>
                          <option value="LOAN">LOAN (Advance / EMI approvals)</option>
                          <option value="REIMBURSEMENT">REIMBURSEMENT (Expense Claims)</option>
                          <option value="TAX_DECLARATION">TAX_DECLARATION (Investment Proof reviews)</option>
                          <option value="FNF">FNF (Full & Final Exit settlements)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Approval Levels JSON config</label>
                        <textarea 
                          name="levels" 
                          rows={5} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-700 focus:bg-white outline-none"
                          defaultValue={`[
  { "level": 1, "role": "MANAGER", "autoApproveDays": 3 },
  { "level": 2, "role": "HR", "autoApproveDays": 5 },
  { "level": 3, "role": "FINANCE", "autoApproveDays": 5 }
]`}
                        />
                        <p className="text-[10px] text-slate-400 leading-normal">Levels array configuration. Supported roles: <code>MANAGER</code>, <code>HR</code>, <code>FINANCE</code>, <code>PAYROLL_MANAGER</code>, <code>ADMIN</code>.</p>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                      >
                        Save Configuration
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Configs View */}
                  <div className="bg-white border border-slate-200 p-8 rounded-2xl space-y-6 shadow-sm">
                    <h3 className="font-extrabold text-sm text-slate-900">Active Configurations</h3>
                    
                    <div className="space-y-4">
                      {workflowConfigs.map(config => (
                        <div key={config.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <span className="font-extrabold text-xs text-slate-800">{config.workflowType}</span>
                            <span className="px-2 py-0.5 text-[9px] rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {config.status}
                            </span>
                          </div>
                          <div className="space-y-1.5 pt-1.5">
                            {Array.isArray(config.approvalLevels) && config.approvalLevels.map((lvl, lidx) => (
                              <div key={lidx} className="flex items-center space-x-2 text-[11px] text-slate-500">
                                <span className="h-4.5 w-4.5 rounded-full bg-slate-200 text-[10px] flex items-center justify-center font-bold text-slate-600">
                                  {lvl.level}
                                </span>
                                <span className="font-bold text-slate-700">{lvl.role}</span>
                                <span>•</span>
                                <span>Auto-approve: {lvl.autoApproveDays} days</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {workflowConfigs.length === 0 && (
                        <p className="text-xs text-slate-500 text-center py-4">Using system default settings. Add custom rules on the left.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
                  {/* Left Column: Create/Edit Component */}
                  <div className="lg:col-span-1 bg-white border border-slate-200 p-8 rounded-2xl space-y-6 shadow-sm h-fit">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">
                        {editingComponent ? 'Modify Salary Component' : 'Create Salary Component'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {editingComponent 
                          ? 'Update the properties of the selected component.' 
                          : 'Declare a new customized allowance or deduction component.'}
                      </p>
                    </div>

                    <form onSubmit={handleSaveComponent} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Component Code</label>
                          <input
                            type="text"
                            placeholder="e.g. TRAVEL_ALLOWANCE"
                            disabled={editingComponent !== null}
                            value={componentForm.code}
                            onChange={(e) => setComponentForm({ ...componentForm, code: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white outline-none disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Display Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Travel Allowance"
                            value={componentForm.name}
                            onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
                          <select
                            value={componentForm.category}
                            onChange={(e) => {
                              const cat = e.target.value;
                              setComponentForm({ 
                                ...componentForm, 
                                category: cat,
                                isPartOfGross: cat === 'EARNING',
                                isPFWageComponent: false,
                                isESIWageComponent: false
                              });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 focus:bg-white outline-none font-bold"
                          >
                            <option value="EARNING">EARNING (Allowance)</option>
                            <option value="DEDUCTION">DEDUCTION (Custom)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Formula Type</label>
                          <select
                            value={componentForm.formulaType}
                            onChange={(e) => setComponentForm({ ...componentForm, formulaType: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 focus:bg-white outline-none font-bold"
                          >
                            <option value="FIXED">FIXED (Amount in ₹)</option>
                            <option value="PERCENTAGE">PERCENTAGE (% of Basic)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          {componentForm.formulaType === 'PERCENTAGE' ? 'Percentage (%) value' : 'Fixed Amount (₹) value'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder={componentForm.formulaType === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 2000'}
                          value={componentForm.amountOrPercent}
                          onChange={(e) => setComponentForm({ ...componentForm, amountOrPercent: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white outline-none font-bold"
                        />
                      </div>

                      <div className="border-t border-slate-100 pt-4 space-y-3.5">
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Statutory & Structure Rules</h4>
                        
                        <div className="grid grid-cols-1 gap-3 text-xs">
                          {/* Taxable Toggle */}
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={componentForm.isTaxable}
                              onChange={(e) => setComponentForm({ ...componentForm, isTaxable: e.target.checked })}
                              className="h-4.5 w-4.5 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500"
                            />
                            <div>
                              <span className="font-bold text-slate-850">Taxable Component</span>
                              <p className="text-[10px] text-slate-500">Subject to TDS tax calculations</p>
                            </div>
                          </label>

                          {componentForm.category === 'EARNING' && (
                            <>
                              {/* Part of Gross Toggle */}
                              <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={componentForm.isPartOfGross}
                                  onChange={(e) => setComponentForm({ ...componentForm, isPartOfGross: e.target.checked })}
                                  className="h-4.5 w-4.5 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500"
                                />
                                <div>
                                  <span className="font-bold text-slate-850">Include in Gross Salary</span>
                                  <p className="text-[10px] text-slate-500">Adds to the monthly gross payout total</p>
                                </div>
                              </label>

                              {/* Part of CTC Toggle */}
                              <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={componentForm.isPartOfCTC}
                                  onChange={(e) => setComponentForm({ ...componentForm, isPartOfCTC: e.target.checked })}
                                  className="h-4.5 w-4.5 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500"
                                />
                                <div>
                                  <span className="font-bold text-slate-855">Include in Annual CTC</span>
                                  <p className="text-[10px] text-slate-500">Factored in cost-to-company aggregate</p>
                                </div>
                              </label>

                              {/* PF Wage Component */}
                              <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={componentForm.isPFWageComponent}
                                  onChange={(e) => setComponentForm({ ...componentForm, isPFWageComponent: e.target.checked })}
                                  className="h-4.5 w-4.5 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500"
                                />
                                <div>
                                  <span className="font-bold text-slate-855">PF Wage component</span>
                                  <p className="text-[10px] text-slate-500">Contributes to the base wages for EPF calculations</p>
                                </div>
                              </label>

                              {/* ESI Wage Component */}
                              <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={componentForm.isESIWageComponent}
                                  onChange={(e) => setComponentForm({ ...componentForm, isESIWageComponent: e.target.checked })}
                                  className="h-4.5 w-4.5 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500"
                                />
                                <div>
                                  <span className="font-bold text-slate-855">ESI Wage component</span>
                                  <p className="text-[10px] text-slate-500">Contributes to the base wages for ESIC eligibility & premiums</p>
                                </div>
                              </label>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 flex items-center gap-3">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>{editingComponent ? 'Update Component' : 'Create Component'}</span>
                        </button>
                        
                        {editingComponent && (
                          <button
                            type="button"
                            onClick={() => {
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
                            }}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Right Column: Component List */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 p-8 rounded-2xl space-y-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">Declared Salary Components</h3>
                        <p className="text-xs text-slate-500 mt-1">Declared component models that can be assigned to employee rosters.</p>
                      </div>
                      <span className="px-2.5 py-1 text-[10px] rounded-full font-bold bg-indigo-50 border border-indigo-150 text-indigo-700 uppercase">
                        {masterComponents.length} Active masters
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                            <th className="p-3">Component / Code</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Calculation</th>
                            <th className="p-3">Rules</th>
                            <th className="p-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {masterComponents.map(comp => {
                            const val = comp.formulaType === 'PERCENTAGE'
                              ? `${comp.formulaConfig?.percentage || 0}% of Basic`
                              : `₹${(comp.formulaConfig?.value || comp.formulaConfig?.fixedAmount || 0).toLocaleString('en-IN')}`;

                            return (
                              <tr key={comp.id} className="hover:bg-slate-50/30 transition-all">
                                <td className="p-3">
                                  <p className="font-bold text-slate-800">{comp.name}</p>
                                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{comp.code}</span>
                                </td>
                                <td className="p-3 font-semibold">
                                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase ${
                                    comp.category === 'EARNING' 
                                      ? 'bg-emerald-50 border border-emerald-150 text-emerald-700' 
                                      : 'bg-rose-50 border border-rose-150 text-rose-700'
                                  }`}>
                                    {comp.category}
                                  </span>
                                </td>
                                <td className="p-3 font-bold text-slate-800">
                                  {val}
                                </td>
                                <td className="p-3 space-y-1">
                                  <div className="flex flex-wrap gap-1 text-[9px] font-bold">
                                    {comp.isTaxable && (
                                      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">TAXABLE</span>
                                    )}
                                    {comp.isPartOfGross && (
                                      <span className="bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded">GROSS</span>
                                    )}
                                    {comp.isPartOfCTC && (
                                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded">CTC</span>
                                    )}
                                    {comp.isPFWageComponent && (
                                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">PF BASE</span>
                                    )}
                                    {comp.isESIWageComponent && (
                                      <span className="bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">ESI BASE</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditComponent(comp)}
                                      className="p-1.5 hover:bg-slate-100 text-indigo-600 hover:text-indigo-800 rounded transition-colors"
                                      title="Edit Component"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    
                                    {comp.code !== 'BASIC' ? (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteComponent(comp.id)}
                                        className="p-1.5 hover:bg-slate-100 text-rose-600 hover:text-rose-800 rounded transition-colors"
                                        title="Deactivate Component"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    ) : (
                                      <span className="p-1.5 text-slate-350 cursor-not-allowed" title="Core System Component (Locked)">
                                        <ShieldCheck className="h-4 w-4 text-slate-400" />
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {masterComponents.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400">
                                No components configured. Create a new component on the left.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Draft Payslip Drawer */}
          {activeDraftEmployee && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
              <div 
                className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drawer Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center space-x-3.5">
                    <div className="h-11 w-11 bg-indigo-100 text-indigo-700 font-black rounded-full flex items-center justify-center text-lg">
                      {activeDraftEmployee.firstName?.[0]}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base">{activeDraftEmployee.firstName} {activeDraftEmployee.lastName}</h3>
                      <p className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider">
                        {activeDraftEmployee.employeeCode} • {activeDraftEmployee.designation} ({activeDraftEmployee.department})
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setActiveDraftEmployee(null)}
                    className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans">
                  
                  {/* Attendance Summary */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5">
                    <h4 className="font-extrabold text-xs text-indigo-800 uppercase tracking-wider">Attendance Parameters Summary</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase">Paid Days</span>
                        <span className="font-extrabold text-slate-800 text-sm">{activeDraftEmployee.payableDays} / {activeDraftEmployee.payrollDays}</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase">Present Days</span>
                        <span className="font-extrabold text-slate-800 text-sm">{activeDraftEmployee.presentDays}</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase">Leaves Taken</span>
                        <span className="font-extrabold text-slate-800 text-sm">{activeDraftEmployee.paidLeaves}</span>
                      </div>
                      <div className="p-3 bg-rose-50 border-rose-100 rounded-xl border">
                        <span className="text-rose-500 block text-[10px] uppercase">LOP Days</span>
                        <span className="font-black text-rose-600 text-sm">{activeDraftEmployee.lopDays}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payslip Elements */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                      <h4 className="font-extrabold text-xs text-slate-800 uppercase">Draft Payslip Overview</h4>
                      <span className="px-2.5 py-0.5 text-[10px] rounded-full font-bold bg-indigo-50 border border-indigo-150 text-indigo-700 uppercase">
                        {((activeDraftEmployee.taxBreakdown && typeof activeDraftEmployee.taxBreakdown === 'object' && activeDraftEmployee.taxBreakdown.regime) || 'NEW')} regime
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                      
                      {/* Earnings */}
                      <div className="p-5 space-y-4">
                        <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest pb-1 border-b border-emerald-50">Earnings (Incurred)</h5>
                        <div className="space-y-2.5 text-xs">
                          {activeDraftEmployee.earningsBreakdown && typeof activeDraftEmployee.earningsBreakdown === 'object' && Object.entries(activeDraftEmployee.earningsBreakdown).map(([c, v]) => (
                            <div key={c} className="flex justify-between hover:bg-slate-50/50 p-1 rounded transition-all">
                              <span className="text-slate-500 font-bold">{c.replace(/_/g, ' ')}</span>
                              <span className="text-slate-800 font-semibold">₹{Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          ))}
                          <div className="flex justify-between pt-2 border-t border-dashed border-slate-100 text-emerald-600 font-extrabold">
                            <span>OT / Bonus / Reimbursements:</span>
                            <span>₹{Number((activeDraftEmployee.overtimeAmount || 0) + (activeDraftEmployee.bonusAmount || 0) + (activeDraftEmployee.reimbursementAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          {activeDraftEmployee.lopDays > 0 && (() => {
                            const fullGross = activeDraftEmployee.grossEarnings 
                              ? (activeDraftEmployee.grossEarnings / ((activeDraftEmployee.payableDays || 1) / (activeDraftEmployee.payrollDays || 30)))
                              : 0;
                            const lopAmount = Math.round(fullGross - (activeDraftEmployee.grossEarnings || 0));
                            return lopAmount > 0 ? (
                              <div className="flex justify-between pt-1 text-rose-500 font-bold bg-rose-50/50 -mx-1 px-2 py-1.5 rounded-lg">
                                <span className="flex items-center gap-1">
                                  <span className="inline-block w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
                                  Loss of Pay ({activeDraftEmployee.lopDays} day{activeDraftEmployee.lopDays > 1 ? 's' : ''}):
                                </span>
                                <span>-₹{lopAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                            ) : null;
                          })()}
                          <div className="flex justify-between pt-2 border-t border-slate-200 text-slate-900 font-black text-sm">
                            <span>Gross Earnings:</span>
                            <span>₹{Number(activeDraftEmployee.totalEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Deductions */}
                      <div className="p-5 space-y-4 bg-slate-50/30">
                        <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-widest pb-1 border-b border-rose-50">Deductions (Applied)</h5>
                        <div className="space-y-2.5 text-xs">
                          {activeDraftEmployee.deductionsBreakdown && typeof activeDraftEmployee.deductionsBreakdown === 'object' && Object.entries(activeDraftEmployee.deductionsBreakdown).map(([c, v]) => (
                            <div key={c} className="flex justify-between hover:bg-slate-50/50 p-1 rounded transition-all">
                              <span className="text-slate-500 font-bold">{c.replace(/_EMPLOYEE|_EARNED/g, '').replace(/_/g, ' ')}</span>
                              <span className="text-rose-600 font-semibold">-₹{Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          ))}
                          
                          <div className="flex justify-between text-rose-600 border-t border-dashed border-slate-200 pt-2">
                            <span className="font-bold">Projected Monthly TDS (Tax):</span>
                            <span className="font-extrabold">-₹{Number(activeDraftEmployee.totalTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          
                          {(activeDraftEmployee.loanRecovery > 0 || activeDraftEmployee.advanceRecovery > 0) && (
                            <div className="flex justify-between text-slate-500">
                              <span>Loans/Advances:</span>
                              <span className="font-semibold">-₹{Number((activeDraftEmployee.loanRecovery || 0) + (activeDraftEmployee.advanceRecovery || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}

                          <div className="flex justify-between pt-2 border-t border-slate-200 text-slate-900 font-black text-sm">
                            <span>Total Deductions:</span>
                            <span className="text-rose-600">-₹{Number(activeDraftEmployee.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Net Payable Banner */}
                    <div className="p-5 bg-indigo-50 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase">Net Take-Home Salary</span>
                        <h4 className="text-xl font-black text-indigo-800 mt-0.5">
                          ₹{Number(activeDraftEmployee.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </h4>
                      </div>
                      <div className="text-[10px] text-indigo-600 bg-indigo-100/50 px-3 py-1.5 rounded-xl border border-indigo-200/50 font-bold">
                        Calculated Secure Draft
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                  <button 
                    type="button"
                    onClick={() => setActiveDraftEmployee(null)}
                    className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all"
                  >
                    Close Preview
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleOpenInspectorFromDraft(activeDraftEmployee.employeeId)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Open Calculator Inspector</span>
                  </button>
                </div>
              </div>
            </div>
          )}

    </div>
  );
}
