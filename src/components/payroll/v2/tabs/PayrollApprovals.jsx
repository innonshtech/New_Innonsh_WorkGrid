import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function PayrollApprovals({
  pendingApprovals = [],
  decisionComments = {},
  setDecisionComments,
  processApprovalDecision
}) {
  return (
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
  );
}
