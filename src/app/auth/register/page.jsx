"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye, EyeOff, User, Mail, Lock, Phone, Building2,
  AlertCircle, Loader2, CheckCircle2, ArrowRight,
  Sparkles, Users, BarChart3, Shield, Check
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

// â”€â”€ Tiny reusable input field â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Field({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3 h-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

function Input({ icon: Icon, error, className = "", ...props }) {
  return (
    <div className="relative group">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input
        className={`w-full ${Icon ? "pl-10" : "pl-3.5"} pr-4 py-3 bg-slate-50 border rounded-xl outline-none text-sm transition-all duration-200
          ${error
            ? "border-red-300 focus:ring-2 focus:ring-red-100 bg-red-50/30"
            : "border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 hover:border-slate-300 placeholder:text-slate-400"
          } ${className}`}
        {...props}
      />
    </div>
  );
}

// â”€â”€ Password strength indicator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PasswordStrength({ password }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number or symbol", ok: /[\d!@#$%^&*]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["bg-red-400", "bg-amber-400", "bg-emerald-500"];
  const labels = ["Weak", "Fair", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < score ? colors[score - 1] : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {checks.map((c) => (
            <span key={c.label} className={`text-[10px] flex items-center gap-1 ${c.ok ? "text-emerald-600" : "text-slate-400"}`}>
              <Check className={`w-2.5 h-2.5 ${c.ok ? "text-emerald-500" : "text-slate-300"}`} strokeWidth={3} />
              {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={`text-[10px] font-bold ${score === 3 ? "text-emerald-600" : score === 2 ? "text-amber-600" : "text-red-500"}`}>
            {labels[score - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

// ——— Feature bullets for hero panel —————————————————————————————————————————
const features = [
  { icon: Users,     text: "Manage unlimited employees across departments" },
  { icon: BarChart3, text: "Automated payroll with statutory compliance" },
  { icon: Shield,    text: "Role-based access — admin, employee" },
  { icon: Sparkles,  text: "14-day free trial. No credit card required." },
];

const COMPANY_SIZES = [
  "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"
];
const INDUSTRIES = [
  "Technology", "Manufacturing", "Healthcare", "Retail", "Finance",
  "Education", "Hospitality", "Construction", "Other"
];

// â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    companyName: "", phone: "", companySize: "", industry: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [field]: val }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side pre-check
    const clientErrors = {};
    if (!form.name.trim())               clientErrors.name         = "Full name is required";
    if (!form.email.trim())              clientErrors.email        = "Work email is required";
    if (!form.password)                  clientErrors.password     = "Password is required";
    else if (form.password.length < 8)   clientErrors.password     = "Minimum 8 characters";
    if (form.password !== form.confirmPassword) clientErrors.confirmPassword = "Passwords do not match";
    if (!form.companyName.trim())        clientErrors.companyName  = "Company name is required";
    if (!form.agreeToTerms)              clientErrors.agreeToTerms = "You must accept the terms";

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:          form.name.trim(),
          email:         form.email.trim().toLowerCase(),
          password:      form.password,
          confirmPassword: form.confirmPassword,
          companyName:   form.companyName.trim(),
          phone:         form.phone.trim(),
          companySize:   form.companySize,
          industry:      form.industry,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
          toast.error("Please fix the errors below");
        } else {
          toast.error(data.message || "Registration failed. Please try again.");
        }
        return;
      }

      // Success!
      setSuccess(true);
      toast.success("Request submitted! We'll review it shortly.");
    } catch (err) {
      toast.error("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // â”€â”€ Success State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 p-4">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Request Submitted! ðŸŽ‰</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Your registration request has been submitted for review. Our team will review your information and get back to you shortly.
          </p>
          <p className="text-slate-400 text-xs">
            You'll receive a confirmation once your account is approved.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-sm"
          >
            Go to Login <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // â”€â”€ Main Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="min-h-screen flex bg-white font-sans text-slate-800">
      <Toaster position="top-center" />

      {/* â”€â”€ Left: Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-20 py-10 overflow-y-auto">
        <div className="max-w-lg w-full mx-auto">

          {/* Brand */}
          <Link href="/login" className="flex items-center gap-2 mb-8 w-fit">
            <img src="/name_logo.png" alt="WorkGrid Logo" width="32" height="32" className="rounded-lg object-contain bg-indigo-600" />
            <span className="text-xl font-bold text-slate-900 tracking-tight">WorkGrid</span>
          </Link>

          {/* Header */}
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Free 14-Day Trial</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1.5">Create your account</h1>
            <p className="text-slate-500 text-sm">
              Set up your HR workspace in minutes. No credit card required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Row: Name + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required error={errors.name}>
                <Input
                  icon={User}
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={set("name")}
                  error={errors.name}
                  autoComplete="name"
                />
              </Field>
              <Field label="Phone Number" error={errors.phone}>
                <Input
                  icon={Phone}
                  type="tel"
                  placeholder="98XXXXXXXX"
                  value={form.phone}
                  onChange={set("phone")}
                  error={errors.phone}
                  autoComplete="tel"
                />
              </Field>
            </div>

            {/* Work Email */}
            <Field label="Work Email" required error={errors.email}>
              <Input
                icon={Mail}
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={set("email")}
                error={errors.email}
                autoComplete="email"
              />
            </Field>

            {/* Company Name */}
            <Field label="Company Name" required error={errors.companyName}>
              <Input
                icon={Building2}
                type="text"
                placeholder="Acme Corp Pvt. Ltd."
                value={form.companyName}
                onChange={set("companyName")}
                error={errors.companyName}
              />
            </Field>

            {/* Company Size + Industry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Company Size" error={errors.companySize}>
                <select
                  value={form.companySize}
                  onChange={set("companySize")}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm transition-all hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-700"
                >
                  <option value="">Select size...</option>
                  {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </Field>
              <Field label="Industry" error={errors.industry}>
                <select
                  value={form.industry}
                  onChange={set("industry")}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm transition-all hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-700"
                >
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </Field>
            </div>

            {/* Password */}
            <Field label="Password" required error={errors.password}>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={set("password")}
                  autoComplete="new-password"
                  className={`w-full pl-10 pr-12 py-3 bg-slate-50 border rounded-xl outline-none text-sm transition-all duration-200 ${
                    errors.password
                      ? "border-red-300 focus:ring-2 focus:ring-red-100 bg-red-50/30"
                      : "border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 hover:border-slate-300 placeholder:text-slate-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm Password" required error={errors.confirmPassword}>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  autoComplete="new-password"
                  className={`w-full pl-10 pr-12 py-3 bg-slate-50 border rounded-xl outline-none text-sm transition-all duration-200 ${
                    errors.confirmPassword
                      ? "border-red-300 focus:ring-2 focus:ring-red-100 bg-red-50/30"
                      : form.confirmPassword && form.password === form.confirmPassword
                      ? "border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                      : "border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 hover:border-slate-300 placeholder:text-slate-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <CheckCircle2 className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
                )}
              </div>
            </Field>

            {/* Terms Checkbox */}
            <div className="space-y-1">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div
                  className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    form.agreeToTerms ? "bg-indigo-600 border-indigo-600" : "border-slate-300 group-hover:border-indigo-400"
                  }`}
                  onClick={() => setForm((p) => ({ ...p, agreeToTerms: !p.agreeToTerms }))}
                >
                  {form.agreeToTerms && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </div>
                <input type="checkbox" className="hidden" checked={form.agreeToTerms} onChange={set("agreeToTerms")} />
                <span className="text-sm text-slate-600 leading-relaxed">
                  I agree to the{" "}
                  <a href="#" className="text-indigo-600 font-semibold hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="text-indigo-600 font-semibold hover:underline">Privacy Policy</a>.
                  Your data is yours, always.
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium pl-7">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {errors.agreeToTerms}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating your workspace...</>
              ) : (
                <>{loading ? "Submitting..." : "Submit Request"} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            {/* Already have account */}
            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* â”€â”€ Right: Hero Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-center bg-indigo-600 relative overflow-hidden px-12 xl:px-16">
        {/* Blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 space-y-10">
          {/* Heading */}
          <div>
            <p className="text-indigo-200 text-sm font-semibold uppercase tracking-widest mb-3">
              SaaS HR & Payroll Platform
            </p>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Everything your HR team needs, in one platform.
            </h2>
            <p className="text-indigo-100 text-base">
              From onboarding to payslips â€” built for modern Indian businesses.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-indigo-100 font-medium">{text}</p>
              </div>
            ))}
          </div>

          {/* Testimonial card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
            <p className="text-white text-sm leading-relaxed italic mb-4">
              "Switched from spreadsheets to WorkGrid in a day. Payroll now takes 10 minutes instead of 2 days."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                R
              </div>
              <div>
                <p className="text-white font-semibold text-xs">Rahul Mehta</p>
                <p className="text-indigo-200 text-xs">HR Director, TechStart Pvt. Ltd.</p>
              </div>
            </div>
          </div>

          {/* Trial badge */}
          <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 border border-white/20 w-fit">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-white text-sm font-medium">Free 14-day trial Â· No credit card Â· Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
