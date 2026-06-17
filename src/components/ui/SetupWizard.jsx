"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Building2, Layers, Users, UserPlus, CheckCircle2,
  ArrowRight, ArrowLeft, X, Loader2, ChevronRight, Sparkles,
  AlertCircle, Plus, Trash2, Info
} from "lucide-react";
import { toast } from "sonner";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SetupWizard â€” Keka-style first-login onboarding overlay
   Shows only for admin role; disappears once dismissed/completed.
   State is persisted in localStorage keyed by user id.
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const WIZARD_KEY = (userId) => `bizmate_setup_done_${userId}`;

// â”€â”€ Validators â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const validators = {
  required: (v) => !!v?.toString().trim(),
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  phone: (v) => !v || /^[6-9]\d{9}$/.test(v.replace(/\s/g, "")),
  url: (v) => !v || /^https?:\/\/.+\..+/.test(v),
};

// â”€â”€ Progress Step Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StepHeader({ steps, current }) {
  return (
    <div className="flex items-center gap-0 px-8 pt-8 pb-6">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  done
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                    : active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-300 ring-4 ring-indigo-100"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <span
                className={`text-[11px] font-semibold whitespace-nowrap ${
                  active ? "text-indigo-700" : done ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-[2px] mx-2 mb-5 rounded-full transition-all duration-500 ${
                  done ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// â”€â”€ Field with validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Field({ label, required, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500 text-xs">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <Info className="w-3 h-3" /> {hint}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all outline-none
        ${props["aria-invalid"]
          ? "border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200"
          : "border-slate-200 bg-white hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        } ${className}`}
      {...props}
    />
  );
}

function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all outline-none bg-white
        ${props["aria-invalid"]
          ? "border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200"
          : "border-slate-200 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        } ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

// â”€â”€ Step 1: Organization â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StepOrganization({ data, setData, errors, setErrors }) {
  const handle = (field) => (e) => {
    setData((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">Create your Organization</p>
          <p className="text-xs text-slate-500 mt-0.5">
            This is the top-level entity. All employees, departments, and payroll belong to an organization.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Organization Name" required error={errors.name}>
          <Input
            value={data.name || ""}
            onChange={handle("name")}
            placeholder="e.g., Acme Corp Pvt. Ltd."
            aria-invalid={!!errors.name}
          />
        </Field>
        <Field label="Official Email" required error={errors.email}>
          <Input
            type="email"
            value={data.email || ""}
            onChange={handle("email")}
            placeholder="contact@company.com"
            aria-invalid={!!errors.email}
          />
        </Field>
        <Field label="Phone Number" error={errors.phone} hint="10-digit Indian mobile number">
          <Input
            type="tel"
            value={data.phone || ""}
            onChange={handle("phone")}
            placeholder="98XXXXXXXX"
            aria-invalid={!!errors.phone}
          />
        </Field>
        <Field label="Website" error={errors.website}>
          <Input
            type="url"
            value={data.website || ""}
            onChange={handle("website")}
            placeholder="https://company.com"
            aria-invalid={!!errors.website}
          />
        </Field>
        <Field label="Year Established" error={errors.established}>
          <Input
            type="number"
            min={1800}
            max={new Date().getFullYear()}
            value={data.established || ""}
            onChange={handle("established")}
            placeholder={`${new Date().getFullYear()}`}
            aria-invalid={!!errors.established}
          />
        </Field>
        <Field label="Status">
          <Select value={data.status || "Active"} onChange={handle("status")}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
        </Field>
      </div>

      <Field label="Description" error={errors.description}>
        <textarea
          value={data.description || ""}
          onChange={handle("description")}
          placeholder="Brief description of your organization..."
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm transition-all outline-none hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
        />
      </Field>
    </div>
  );
}

// â”€â”€ Step 2: Business Unit (optional) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StepBusinessUnit({ data, setData, errors, setErrors, orgId, orgName }) {
  const [units, setUnits] = useState(data.units || [{ name: "", description: "" }]);

  useEffect(() => {
    setData((p) => ({ ...p, units }));
  }, [units]);

  const addUnit = () => setUnits((p) => [...p, { name: "", description: "" }]);
  const removeUnit = (i) => setUnits((p) => p.filter((_, idx) => idx !== i));
  const updateUnit = (i, field, val) =>
    setUnits((p) => p.map((u, idx) => (idx === i ? { ...u, [field]: val } : u)));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-4 bg-violet-50 rounded-2xl border border-violet-100">
        <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shrink-0">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">Business Units <span className="text-xs font-normal text-violet-600 ml-1">(Optional)</span></p>
          <p className="text-xs text-slate-500 mt-0.5">
            Divisions within <strong>{orgName}</strong>. E.g., South India Operations, Product Team. You can skip this step.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {units.map((unit, i) => (
          <div key={i} className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex-1 space-y-2">
              <Input
                value={unit.name}
                onChange={(e) => updateUnit(i, "name", e.target.value)}
                placeholder={`Business Unit Name (e.g., South Region)`}
                aria-invalid={!!errors[`unit_${i}_name`]}
              />
              <Input
                value={unit.description}
                onChange={(e) => updateUnit(i, "description", e.target.value)}
                placeholder="Brief description (optional)"
              />
              {errors[`unit_${i}_name`] && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors[`unit_${i}_name`]}
                </p>
              )}
            </div>
            {units.length > 1 && (
              <button
                onClick={() => removeUnit(i)}
                className="mt-1 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addUnit}
        className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add another Business Unit
      </button>
    </div>
  );
}

// â”€â”€ Step 3: Departments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StepDepartments({ data, setData, errors, setErrors, orgId, orgName, businessUnits }) {
  const [depts, setDepts] = useState(data.depts || [{ name: "" }]);

  useEffect(() => {
    setData((p) => ({ ...p, depts }));
  }, [depts]);

  const addDept = () => setDepts((p) => [...p, { name: "" }]);
  const removeDept = (i) => setDepts((p) => p.filter((_, idx) => idx !== i));
  const update = (i, val) =>
    setDepts((p) => p.map((d, idx) => (idx === i ? { ...d, name: val } : d)));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">Create Departments</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Departments under <strong>{orgName}</strong>. E.g., Engineering, HR, Finance. At least one is required.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {depts.map((dept, i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="flex-1">
              <Input
                value={dept.name}
                onChange={(e) => {
                  update(i, e.target.value);
                  if (errors[`dept_${i}`]) setErrors((p) => ({ ...p, [`dept_${i}`]: "" }));
                }}
                placeholder={`Department ${i + 1} (e.g., Engineering)`}
                aria-invalid={!!errors[`dept_${i}`]}
              />
              {errors[`dept_${i}`] && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors[`dept_${i}`]}
                </p>
              )}
            </div>
            {depts.length > 1 && (
              <button
                onClick={() => removeDept(i)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addDept}
        className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add another Department
      </button>

      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>You can always add more departments later from <strong>CRM &gt; Department</strong>.</span>
      </div>
    </div>
  );
}

// â”€â”€ Step 4: Complete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StepComplete({ orgName, buCount, deptCount, onGoToEmployees, onClose }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-6 text-center">
      <div className="relative">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
      </div>

      <div>
        <h3 className="text-2xl font-bold text-slate-800">You're all set! ðŸŽ‰</h3>
        <p className="text-slate-500 mt-2 text-sm max-w-sm mx-auto">
          Your workspace <strong>{orgName}</strong> is ready.
          {buCount > 0 && ` Created ${buCount} Business Unit${buCount > 1 ? "s" : ""}.`}
          {deptCount > 0 && ` Created ${deptCount} Department${deptCount > 1 ? "s" : ""}.`}
          {" "}Now add your first employee to get started.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          onClick={onGoToEmployees}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
        >
          <UserPlus className="w-4 h-4" /> Add First Employee
        </button>
        <button
          onClick={onClose}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

// â”€â”€ Main Wizard Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function SetupWizard({ user, onComplete }) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0); // 0=org, 1=bu, 2=dept, 3=done
  const [loading, setLoading] = useState(false);

  // Per-step form data
  const [orgData, setOrgData] = useState({ status: "Active" });
  const [buData, setBuData] = useState({ units: [{ name: "", description: "" }] });
  const [deptData, setDeptData] = useState({ depts: [{ name: "" }] });

  // Per-step errors
  const [orgErrors, setOrgErrors] = useState({});
  const [buErrors, setBuErrors] = useState({});
  const [deptErrors, setDeptErrors] = useState({});

  // Created IDs for cascade
  const [createdOrg, setCreatedOrg] = useState(null); // { _id, name }
  const [createdBUs, setCreatedBUs] = useState([]);
  const [createdDepts, setCreatedDepts] = useState([]);

  const [dynamicSteps, setDynamicSteps] = useState([
    { id: "bu", label: "Business Units", icon: Layers },
    { id: "dept", label: "Departments", icon: Users },
    { id: "done", label: "Complete", icon: CheckCircle2 },
  ]);

  // Check if wizard should show on mount
  useEffect(() => {
    if (!user || user.role !== "admin") return;
    const doneKey = WIZARD_KEY(user.id);
    const alreadyDone = localStorage.getItem(doneKey);
    if (alreadyDone) return;

    // Fetch admin's existing organization (created during approval)
    fetch("/api/v1/admin/crm/organizations?limit=1")
      .then((r) => r.json())
      .then((data) => {
        if (data.data && data.data.length > 0) {
          const org = data.data[0];
          setCreatedOrg({ _id: org._id, name: org.name });
          // Check if departments already exist for this org
          fetch(`/api/v1/admin/crm/departments?organizationId=${org._id}`)
            .then((r) => r.json())
            .then((deptData) => {
              if (deptData.data && deptData.data.length > 0) {
                // Already set up, mark done
                localStorage.setItem(doneKey, "true");
              } else {
                setShow(true);
              }
            })
            .catch(() => setShow(true));
        } else {
          // Even if no org record is found in CRM, we skip the Org step as requested
          // and start with Business Units / Departments.
          setShow(true);
        }
      })
      .catch(() => {}); // Silently fail
  }, [user]);

  const dismiss = (markAsDone = false) => {
    if (markAsDone === true) {
      localStorage.setItem(WIZARD_KEY(user?.id), "true");
    }
    setShow(false);
    onComplete?.();
  };

  // â”€â”€ Validate and Submit Step â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const validateOrg = () => {
    const e = {};
    if (!validators.required(orgData.name)) e.name = "Organization name is required";
    if (!validators.required(orgData.email)) e.email = "Email is required";
    else if (!validators.email(orgData.email)) e.email = "Enter a valid email address";
    if (orgData.phone && !validators.phone(orgData.phone)) e.phone = "Enter a valid 10-digit phone number";
    if (orgData.website && !validators.url(orgData.website)) e.website = "Enter a valid URL (https://...)";
    setOrgErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateBU = () => {
    const e = {};
    const nonEmpty = (buData.units || []).filter((u) => u.name.trim());
    if (nonEmpty.length === 0) return true; // BU is optional â€” allow proceeding even if all blank

    nonEmpty.forEach((u, i) => {
      if (u.name.trim() && u.name.trim().length < 2) {
        e[`unit_${i}_name`] = "Business unit name must be at least 2 characters";
      }
    });
    setBuErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateDepts = () => {
    const e = {};
    const depts = (deptData.depts || []);
    const hasValid = depts.some((d) => d.name.trim());
    if (!hasValid) {
      e["dept_0"] = "At least one department name is required";
    }
    depts.forEach((d, i) => {
      if (d.name.trim() && d.name.trim().length < 2) {
        e[`dept_${i}`] = "Department name must be at least 2 characters";
      }
    });
    setDeptErrors(e);
    return Object.keys(e).length === 0;
  };

  // â”€â”€ API calls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const submitOrg = async () => {
    if (!validateOrg()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(orgData).forEach(([k, v]) => { if (v !== undefined && v !== "") fd.append(k, v); });
      if (user?.id) fd.append("createdBy", user.id);

      const res = await fetch("/api/v1/admin/crm/organizations", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create organization");

      setCreatedOrg({ _id: json._id, name: json.name });
      toast.success(`Organization "${json.name}" created!`);
      setStep((p) => p + 1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitBUs = async () => {
    if (!validateBU()) return;
    setLoading(true);
    const nonEmpty = (buData.units || []).filter((u) => u.name.trim());

    try {
      const created = [];
      for (const unit of nonEmpty) {
        const res = await fetch("/api/v1/admin/crm/business-units", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId: createdOrg._id, name: unit.name.trim(), description: unit.description }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `Failed to create Business Unit "${unit.name}"`);
        created.push({ _id: json.businessUnit._id, name: unit.name });
      }
      setCreatedBUs(created);
      if (created.length > 0) toast.success(`${created.length} Business Unit(s) created!`);
      setStep((p) => p + 1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const skipBUs = () => {
    setCreatedBUs([]);
    setStep((p) => p + 1);
  };

  const submitDepts = async () => {
    if (!validateDepts()) return;
    setLoading(true);
    const nonEmpty = (deptData.depts || []).filter((d) => d.name.trim());

    try {
      const created = [];
      for (const dept of nonEmpty) {
        const res = await fetch("/api/v1/admin/crm/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: createdOrg._id,
            departmentName: dept.name.trim(),
            status: "Active",
            createdBy: user?.id || null,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `Failed to create Department "${dept.name}"`);
        created.push({ _id: json.department._id, name: dept.name });
      }
      setCreatedDepts(created);
      toast.success(`${created.length} Department(s) created!`);
      setStep((p) => p + 1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const currentStepId = dynamicSteps[step].id;
    if (currentStepId === "org") submitOrg();
    else if (currentStepId === "bu") submitBUs();
    else if (currentStepId === "dept") submitDepts();
  };

  const handleGoToEmployees = () => {
    dismiss(true);
    window.location.href = "/payroll/employees/new";
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-300">
        {/* Top gradient band */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-violet-500 to-emerald-500" />

        {/* Header */}
        <div className="px-8 pt-7 pb-0 flex items-start justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Setup Wizard</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome to WorkGrid! ðŸ‘‹</h2>
            <p className="text-slate-500 text-sm mt-1">
              Let's set up your workspace in just a few steps.
            </p>
          </div>
          {dynamicSteps[step]?.id !== "done" && (
            <button
              onClick={() => dismiss(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0 ml-4 mt-1"
              title="Skip setup (you can do this later)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Progress */}
        <StepHeader steps={dynamicSteps} current={step} />

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-4">
          {dynamicSteps[step]?.id === "org" && (
            <StepOrganization
              data={orgData}
              setData={setOrgData}
              errors={orgErrors}
              setErrors={setOrgErrors}
            />
          )}
          {dynamicSteps[step]?.id === "bu" && (
            <StepBusinessUnit
              data={buData}
              setData={setBuData}
              errors={buErrors}
              setErrors={setBuErrors}
              orgId={createdOrg?._id}
              orgName={createdOrg?.name || user?.companyName || "Your Organization"}
            />
          )}
          {dynamicSteps[step]?.id === "dept" && (
            <StepDepartments
              data={deptData}
              setData={setDeptData}
              errors={deptErrors}
              setErrors={setDeptErrors}
              orgId={createdOrg?._id}
              orgName={createdOrg?.name || user?.companyName || "Your Organization"}
              businessUnits={createdBUs}
            />
          )}
          {dynamicSteps[step]?.id === "done" && (
            <StepComplete
              orgName={createdOrg?.name || user?.companyName || "Your Organization"}
              buCount={createdBUs.length}
              deptCount={createdDepts.length}
              onGoToEmployees={handleGoToEmployees}
              onClose={() => dismiss(true)}
            />
          )}
        </div>

        {/* Footer Navigation */}
        {dynamicSteps[step]?.id !== "done" && (
          <div className="flex-shrink-0 px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="text-xs text-slate-400">
              Step {step + 1} of {dynamicSteps.length - 1}
              {dynamicSteps[step]?.id === "bu" && (
                <span className="ml-2 text-violet-500 font-medium">Â· Optional</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep((p) => p - 1)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              {dynamicSteps[step]?.id === "bu" && (
                <button
                  onClick={skipBUs}
                  disabled={loading}
                  className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                >
                  Skip for now
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <>{dynamicSteps[step]?.id === "dept" ? "Finish Setup" : "Continue"} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
