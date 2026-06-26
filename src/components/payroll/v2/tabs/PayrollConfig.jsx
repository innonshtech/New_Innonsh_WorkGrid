import React from 'react';
import { Save, Edit, Trash2, ShieldCheck } from 'lucide-react';
import StatutoryRulesConfig from './StatutoryRulesConfig';

export default function PayrollConfig({
  workflowConfigs = [],
  masterComponents = [],
  editingComponent,
  setEditingComponent,
  componentForm,
  setComponentForm,
  configSubTab,
  setConfigSubTab,
  saveWorkflowConfig,
  handleSaveComponent,
  handleEditComponent,
  handleDeleteComponent
}) {
  return (
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
        <button
          type="button"
          onClick={() => setConfigSubTab('statutory')}
          className={`py-3 px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
            configSubTab === 'statutory'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Statutory & Compliance Rules
        </button>
      </div>

      {configSubTab === 'workflows' && (
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
                <select name="type" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:bg-white outline-none font-bold">
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
      )}

      {configSubTab === 'statutory' && (
        <StatutoryRulesConfig />
      )}

      {(configSubTab === 'components' || !configSubTab) && (
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
                          <span className="font-bold text-slate-855">Include in Gross Salary</span>
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
  );
}
