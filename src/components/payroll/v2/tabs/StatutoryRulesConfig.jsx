import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Plus, Trash2, Info, CheckCircle2, RefreshCw } from 'lucide-react';

export default function StatutoryRulesConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Tab states inside Statutory Rules
  const [activeSubSection, setActiveSubSection] = useState('pf-esi'); // 'pf-esi' or 'tax-slabs'
  const [selectedRegime, setSelectedRegime] = useState('NEW'); // 'NEW' or 'OLD'
  const [selectedFY, setSelectedFY] = useState('2026-27');

  // Core compliance state
  const [pfConfig, setPfConfig] = useState({
    pfCeiling: 15000,
    employeePFRate: 12,
    employerPFRate: 12,
    epsRate: 8.33,
    adminChargeRate: 0.5,
    edliRate: 0.5,
    restrictToCeiling: true,
    pfWageComponents: ['BASIC', 'DA']
  });

  const [esiConfig, setEsiConfig] = useState({
    grossThreshold: 21000,
    employeeRate: 0.75,
    employerRate: 3.25
  });

  const [allSlabs, setAllSlabs] = useState([]);
  const [allSections, setAllSections] = useState([]);

  // Fetch configs from database on load
  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/payroll/settings/statutory-rules');
      if (res.ok) {
        const data = await res.json();
        if (data.pfConfig) setPfConfig(data.pfConfig);
        if (data.esiConfig) setEsiConfig(data.esiConfig);
        if (data.taxSlabs) setAllSlabs(data.taxSlabs);
        if (data.taxSections) {
          const sections = [...data.taxSections];
          if (!sections.some(s => s.sectionCode === 'HRA_METRO_RATE')) {
            sections.push({
              id: 'default-hra-metro',
              sectionCode: 'HRA_METRO_RATE',
              name: 'HRA Metro Exemption Rate (%)',
              maxLimit: 50,
              applicableRegime: 'both',
              isActive: true
            });
          }
          if (!sections.some(s => s.sectionCode === 'HRA_NON_METRO_RATE')) {
            sections.push({
              id: 'default-hra-nonmetro',
              sectionCode: 'HRA_NON_METRO_RATE',
              name: 'HRA Non-Metro Exemption Rate (%)',
              maxLimit: 40,
              applicableRegime: 'both',
              isActive: true
            });
          }
          setAllSections(sections);
        }
      }
    } catch (err) {
      console.error('Failed to load statutory rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Filter slabs based on selected Regime and Financial Year
  const currentSlabs = allSlabs.filter(
    s => s.regime.toUpperCase() === selectedRegime && s.financialYear === selectedFY
  );

  // Filter tax sections based on selected Regime (case-insensitive to support BOTH, both, old, OLD, etc.)
  const currentSections = allSections.filter(
    sec => (sec.applicableRegime?.toUpperCase() === 'BOTH' || sec.applicableRegime?.toUpperCase() === selectedRegime)
           && sec.sectionCode !== 'HRA_METRO_RATE' && sec.sectionCode !== 'HRA_NON_METRO_RATE'
  );

  // Handle saving configurations
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Filter all slabs for the target financial year to ensure both regimes are preserved and saved
    const slabsToSave = allSlabs.filter(s => s.financialYear === selectedFY);

    try {
      const res = await fetch('/api/v1/admin/payroll/settings/statutory-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pfConfig,
          esiConfig,
          taxSlabs: slabsToSave,
          taxSections: allSections, // Save all sections to keep limits for both regimes updated
          targetFinancialYear: selectedFY
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'All statutory & compliance guidelines updated successfully!' });
        fetchRules();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to update configurations.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Add a new tax slab slice
  const handleAddSlab = () => {
    const nextStart = currentSlabs.length > 0 ? currentSlabs[currentSlabs.length - 1].slabTo : 0;
    const newSlab = {
      id: `temp-${Date.now()}`,
      regime: selectedRegime,
      financialYear: selectedFY,
      slabFrom: nextStart,
      slabTo: nextStart + 300000,
      rate: 5,
      surchargeThreshold: null,
      surchargeRate: 0,
      cessRate: 4,
      isActive: true
    };
    setAllSlabs([...allSlabs, newSlab]);
  };

  // Remove a tax slab slice
  const handleRemoveSlab = (id) => {
    setAllSlabs(allSlabs.filter(s => s.id !== id));
  };

  // Update slab field
  const handleSlabChange = (id, field, value) => {
    setAllSlabs(
      allSlabs.map(s => (s.id === id ? { ...s, [field]: Number(value) } : s))
    );
  };

  // Update tax section limit
  const handleSectionChange = (code, limit) => {
    setAllSections(
      allSections.map(sec => (sec.sectionCode === code ? { ...sec, maxLimit: Number(limit) } : sec))
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-bold">Loading statutory compliance data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Alert Message */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> : <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
          <span className="text-xs font-bold">{message.text}</span>
        </div>
      )}

      {/* Internal Navigation Buttons */}
      <div className="flex space-x-2 border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubSection('pf-esi')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubSection === 'pf-esi'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-55'
          }`}
        >
          EPF & ESIC Guidelines
        </button>
        <button
          type="button"
          onClick={() => setActiveSubSection('tax-slabs')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubSection === 'tax-slabs'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-55'
          }`}
        >
          Income Tax Slabs & Deductions
        </button>
        <button
          type="button"
          onClick={() => setActiveSubSection('hra')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubSection === 'hra'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-55'
          }`}
        >
          HRA Guidelines
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {activeSubSection === 'pf-esi' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* PF Rate Configuration */}
            <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-sm">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-slate-800">Employee Provident Fund (EPF) Rules</h3>
                <p className="text-xs text-slate-500 mt-1">Configure contribution percentages and ceiling limits applicable under EPFO guidelines.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Employee Contribution Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pfConfig.employeePFRate}
                    onChange={(e) => setPfConfig({ ...pfConfig, employeePFRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white outline-none"
                  />
                  <p className="text-[9px] text-slate-400">Deducted from employee salary (Standard: 12%)</p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Employer Contribution Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pfConfig.employerPFRate}
                    onChange={(e) => setPfConfig({ ...pfConfig, employerPFRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white outline-none"
                  />
                  <p className="text-[9px] text-slate-400">Total rate contributed by employer (Standard: 12%)</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Pension Contribution Rate (EPS %)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pfConfig.epsRate}
                    onChange={(e) => setPfConfig({ ...pfConfig, epsRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white outline-none"
                  />
                  <p className="text-[9px] text-slate-400">Portion of employer's 12% that goes to Pension (Standard: 8.33%)</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">EPF Ceiling Limit (₹)</label>
                  <input
                    type="number"
                    value={pfConfig.pfCeiling}
                    onChange={(e) => setPfConfig({ ...pfConfig, pfCeiling: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white outline-none"
                  />
                  <p className="text-[9px] text-slate-400">Salary cap above which PF is calculated (Standard: ₹15,000)</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Admin Charges Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pfConfig.adminChargeRate}
                    onChange={(e) => setPfConfig({ ...pfConfig, adminChargeRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white outline-none"
                  />
                  <p className="text-[9px] text-slate-400">Additional admin fee paid by employer (Standard: 0.5%)</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">EDLI Insurance Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pfConfig.edliRate}
                    onChange={(e) => setPfConfig({ ...pfConfig, edliRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white outline-none"
                  />
                  <p className="text-[9px] text-slate-400">Employee life insurance rate paid by employer (Standard: 0.5%)</p>
                </div>

                <div className="col-span-full p-4 bg-slate-55 rounded-xl flex items-center justify-between border border-slate-200">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Restrict Calculations to PF Ceiling</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">If disabled, PF is calculated on full Basic wages (Voluntary Provident Fund).</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPfConfig({ ...pfConfig, restrictToCeiling: !pfConfig.restrictToCeiling })}
                    className={`w-12 h-6 rounded-full transition-all relative ${pfConfig.restrictToCeiling ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${pfConfig.restrictToCeiling ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                {/* EPF Caps Preview Box */}
                <div className="col-span-full bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 animate-pulse" />
                    Calculated Monthly EPF Contribution Caps (Based on your entries)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                      <p className="text-[9px] font-bold text-slate-450 uppercase">Max Employee PF Cap</p>
                      <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                        ₹ {(((pfConfig.pfCeiling || 0) * (pfConfig.employeePFRate || 0)) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[8px] text-slate-400">({pfConfig.employeePFRate}% of ceiling)</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                      <p className="text-[9px] font-bold text-slate-455 uppercase">Max Employer EPS Cap</p>
                      <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                        ₹ {(((pfConfig.pfCeiling || 0) * (pfConfig.epsRate || 0)) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[8px] text-slate-400">({pfConfig.epsRate}% pension cap)</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                      <p className="text-[9px] font-bold text-slate-455 uppercase">Max Employer EPF Cap</p>
                      <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                        ₹ {(((pfConfig.pfCeiling || 0) * Math.max(0, (pfConfig.employerPFRate || 0) - (pfConfig.epsRate || 0))) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[8px] text-slate-400">({Math.max(0, pfConfig.employerPFRate - pfConfig.epsRate).toFixed(2)}% EPF split)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ESIC & Details Sidebar */}
            <div className="space-y-6">
              
              {/* ESI Block */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-800">ESIC Compliance Rules</h3>
                  <p className="text-xs text-slate-500 mt-1">Configure gross wage eligibility thresholds and contribution rates.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Gross Salary Threshold Limit (₹)</label>
                    <input
                      type="number"
                      value={esiConfig.grossThreshold}
                      onChange={(e) => setEsiConfig({ ...esiConfig, grossThreshold: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white outline-none"
                    />
                    <p className="text-[9px] text-slate-400">Employee qualifies if monthly gross salary is ≤ this amount (Standard: ₹21,000)</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Employee ESIC Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={esiConfig.employeeRate}
                      onChange={(e) => setEsiConfig({ ...esiConfig, employeeRate: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white outline-none"
                    />
                    <p className="text-[9px] text-slate-400">Deducted from gross salary (Standard: 0.75%)</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Employer ESIC Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={esiConfig.employerRate}
                      onChange={(e) => setEsiConfig({ ...esiConfig, employerRate: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white outline-none"
                    />
                    <p className="text-[9px] text-slate-400">Contributed by employer (Standard: 3.25%)</p>
                  </div>

                  {/* ESIC Caps Preview Box */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 mt-4">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 animate-pulse" />
                      Calculated Monthly ESIC Caps (Max potential ESI cost)
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                        <p className="text-[9px] font-bold text-slate-450 uppercase">Max Employee ESI</p>
                        <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                          ₹ {(((esiConfig.grossThreshold || 0) * (esiConfig.employeeRate || 0)) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                        <span className="text-[8px] text-slate-400">({esiConfig.employeeRate}% of threshold)</span>
                      </div>
                      <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                        <p className="text-[9px] font-bold text-slate-450 uppercase">Max Employer ESI</p>
                        <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                          ₹ {(((esiConfig.grossThreshold || 0) * (esiConfig.employerRate || 0)) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                        <span className="text-[8px] text-slate-400">({esiConfig.employerRate}% of threshold)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanatory Info Card */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <Info className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">Calculation Details</span>
                </div>
                <ul className="text-[10px] text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
                  <li><strong>EPF splits:</strong> Under the cap, the employee's deduction is 12% (Max ₹1,800). The employer pays 3.67% EPF (Max ₹550) + 8.33% EPS (Max ₹1,250) + Admin fees.</li>
                  <li><strong>ESIC eligibility:</strong> Calculated on overall Gross wages. If the employee's monthly gross exceeds the threshold, ESIC deductions automatically cease.</li>
                </ul>
              </div>

            </div>
          </div>
        )}

        {activeSubSection === 'tax-slabs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tax Slabs list manager */}
            <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">Income Tax Slabs Configuration</h3>
                  <p className="text-xs text-slate-500 mt-1">Add, update or remove tax brackets for specific regimes and fiscal years.</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedFY}
                    onChange={(e) => setSelectedFY(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-bold focus:bg-white outline-none"
                  >
                    <option value="2026-27">FY 2026-27</option>
                    <option value="2027-28">FY 2027-28</option>
                    <option value="2025-26">FY 2025-26</option>
                  </select>
                  <select
                    value={selectedRegime}
                    onChange={(e) => setSelectedRegime(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-bold focus:bg-white outline-none"
                  >
                    <option value="NEW">New Tax Regime</option>
                    <option value="OLD">Old Tax Regime</option>
                  </select>
                </div>
              </div>

              {/* Slabs Table List */}
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 font-bold text-slate-500 bg-slate-50/50">
                        <th className="p-3">Slab Lower limit (₹)</th>
                        <th className="p-3">Slab Upper limit (₹)</th>
                        <th className="p-3 text-center">Tax Rate (%)</th>
                        <th className="p-3 text-center">Cess (%)</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentSlabs.map((slab) => (
                        <tr key={slab.id} className="hover:bg-slate-50/50">
                          <td className="p-2">
                            <input
                              type="number"
                              value={slab.slabFrom}
                              onChange={(e) => handleSlabChange(slab.id, 'slabFrom', e.target.value)}
                              className="w-28 bg-slate-55 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 outline-none text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={slab.slabTo}
                              onChange={(e) => handleSlabChange(slab.id, 'slabTo', e.target.value)}
                              className="w-32 bg-slate-55 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 outline-none text-xs"
                            />
                            <span className="text-[9px] text-slate-400 block mt-0.5">Use 99999999 for infinity</span>
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              step="0.1"
                              value={slab.rate}
                              onChange={(e) => handleSlabChange(slab.id, 'rate', e.target.value)}
                              className="w-16 bg-slate-55 border border-slate-200 rounded-lg px-2 py-1 text-center font-bold text-slate-700 outline-none text-xs"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              step="0.1"
                              value={slab.cessRate}
                              onChange={(e) => handleSlabChange(slab.id, 'cessRate', e.target.value)}
                              className="w-16 bg-slate-55 border border-slate-200 rounded-lg px-2 py-1 text-center font-bold text-slate-700 outline-none text-xs"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveSlab(slab.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {currentSlabs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-500 font-medium">
                            No tax slabs defined for {selectedRegime} regime in FY {selectedFY}. Click below to add.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={handleAddSlab}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 border border-dashed border-indigo-300 hover:border-indigo-500 text-indigo-600 hover:text-indigo-800 font-bold rounded-lg text-xs transition-all w-full md:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Tax Slab Bracket</span>
                </button>
              </div>
            </div>

            {/* Standard Deductions & Section ceilings */}
            <div className="space-y-6">
              
              {/* Exemption Limits */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-800">Limits & Deductions</h3>
                  <p className="text-xs text-slate-500 mt-1">Set maximum limits for various sections under the {selectedRegime} regime.</p>
                </div>

                <div className="space-y-4">
                  {currentSections.map((sec) => (
                    <div key={sec.id} className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">
                        {sec.name} ({sec.sectionCode})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          value={sec.maxLimit}
                          onChange={(e) => handleSectionChange(sec.sectionCode, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-6 pr-3.5 py-2 text-xs font-bold text-slate-850 focus:bg-white outline-none"
                        />
                      </div>
                    </div>
                  ))}
                  {currentSections.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">No sections applicable for this regime.</p>
                  )}
                </div>
              </div>

              {/* Explanatory Info Card */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-slate-800 border-b border-slate-200 pb-2">
                  <Info className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">Statutory Tax Rules Reference</span>
                </div>
                
                <div className="space-y-3 text-[11px] leading-relaxed text-slate-600">
                  <div>
                    <span className="font-extrabold text-slate-800 block">Section 16(ia) — Standard Deduction:</span>
                    <p className="mt-0.5">
                      A flat deduction allowed from gross salary. Currently configured limit is 
                      <strong className="text-indigo-650 font-bold"> ₹ {((currentSections.find(s => s.sectionCode === 'STANDARD_DEDUCTION')?.maxLimit || 75000)).toLocaleString('en-IN')}</strong>.
                    </p>
                  </div>
                  
                  {selectedRegime === 'NEW' ? (
                    <div>
                      <span className="font-extrabold text-slate-800 block">Section 87A — Tax Rebate (New Regime):</span>
                      <p className="mt-0.5">
                        Individuals with taxable income up to <strong className="text-slate-800 font-bold">₹ 12,00,000</strong> are eligible for full tax rebate under Section 87A. Surcharge and Cess are calculated only on taxable income exceeding this threshold.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="font-extrabold text-slate-800 block">Section 80C — Deductions (Old Regime):</span>
                        <p className="mt-0.5">
                          Tax saving investments (PPF, EPF, ELSS, LIC) up to a maximum limit of 
                          <strong className="text-slate-800 font-bold"> ₹ {((currentSections.find(s => s.sectionCode === '80C')?.maxLimit || 150000)).toLocaleString('en-IN')}</strong>.
                        </p>
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-800 block">Section 80D — Medical Insurance:</span>
                        <p className="mt-0.5">
                          Deduction for health insurance premiums paid up to a maximum limit of 
                          <strong className="text-slate-800 font-bold"> ₹ {((currentSections.find(s => s.sectionCode === '80D')?.maxLimit || 25000)).toLocaleString('en-IN')}</strong>.
                        </p>
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-800 block">Section 10(13A) — HRA Exemption:</span>
                        <p className="mt-0.5">
                          Exemption for house rent paid. Calculated dynamically as the minimum of HRA, (Rent Paid - 10% Basic), or 40%/50% of Basic.
                        </p>
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-800 block">Section 87A — Tax Rebate (Old Regime):</span>
                        <p className="mt-0.5">
                          Taxable income up to <strong className="text-slate-800 font-bold">₹ 5,00,000</strong> qualifies for full tax rebate (up to ₹12,500 tax liability).
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {activeSubSection === 'hra' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-sm">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-slate-800">HRA Exemption Guidelines</h3>
                <p className="text-xs text-slate-500 mt-1">Configure default rates used for calculating HRA exemption and allowances.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Metro City HRA Rate (%)</label>
                  <input
                    type="number"
                    value={allSections.find(s => s.sectionCode === 'HRA_METRO_RATE')?.maxLimit ?? 50}
                    onChange={(e) => handleSectionChange('HRA_METRO_RATE', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white outline-none"
                  />
                  <p className="text-[9px] text-slate-400">Used for Metro cities (Mumbai, Delhi, Kolkata, Chennai). Standard: 50%</p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Non-Metro City HRA Rate (%)</label>
                  <input
                    type="number"
                    value={allSections.find(s => s.sectionCode === 'HRA_NON_METRO_RATE')?.maxLimit ?? 40}
                    onChange={(e) => handleSectionChange('HRA_NON_METRO_RATE', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white outline-none"
                  />
                  <p className="text-[9px] text-slate-400">Used for non-metro cities. Standard: 40%</p>
                </div>
              </div>
            </div>

            {/* HRA Explanatory Sidebar */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 h-fit">
              <div className="flex items-center gap-2 text-slate-800 border-b border-slate-200 pb-2">
                <Info className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                <span className="text-xs font-extrabold uppercase tracking-wider font-sans">HRA Exemption (Section 10(13A))</span>
              </div>
              <ul className="text-[11px] text-slate-655 space-y-2 list-disc list-inside leading-relaxed">
                <li><strong>Dynamic Limit:</strong> The exemption is calculated as the minimum of the HRA received, the rent paid minus 10% of basic, or the configured metro/non-metro rate of Basic salary.</li>
                <li><strong>Metro vs Non-Metro:</strong> Metro rate applies when HRA City declaration is set to Metro (Mumbai, Delhi, Kolkata, Chennai).</li>
              </ul>
            </div>
          </div>
        )}

        {/* Form Footer Action */}
        <div className="flex justify-end p-4 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center space-x-2 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4.5 w-4.5" />}
            <span>{saving ? 'Updating Compliance...' : 'Save Configuration Rules'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
