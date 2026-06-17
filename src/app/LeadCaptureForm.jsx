"use client";

import React, { useState } from "react";

export default function LeadCaptureForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    companyName: "",
    employeeCount: "",
    message: ""
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
      } else {
        setErrorMsg(data.message || "Failed to submit request. Please try again.");
      }
    } catch (err) {
      console.error("Form submit error:", err);
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="form-glow"></div>
      <form className="contact-form" id="contact-form" onSubmit={handleSubmit}>
        <div className="form-header">
          <h3>Book a personalized walkthrough</h3>
          <p>Tell us about your team, we will tailor the demo to your workflows.</p>
        </div>

        {success ? (
          <div className="form-success show" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "20px 0" }}>
            <div className="success-icon" style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", margin: "0 auto 16px auto" }}>
              <i className="fa-solid fa-check"></i>
            </div>
            <h4 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>Request received</h4>
            <p style={{ fontSize: "14px", color: "#475569" }}>Thank you. Our team will reach out within 24 hours.</p>
          </div>
        ) : (
          <div className="form-fields">
            {errorMsg && (
              <div style={{ padding: "10px", background: "#FEF2F2", color: "#DC2626", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", border: "1px solid #FECACA" }}>
                {errorMsg}
              </div>
            )}

            <div className="form-field">
              <label htmlFor="cf-email">Work email</label>
              <div className="input-wrap">
                <i className="fa-solid fa-envelope"></i>
                <input type="email" id="cf-email" name="email" value={formData.email} onChange={handleChange} placeholder="you@company.com" required disabled={loading} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="cf-name">Full name</label>
                <div className="input-wrap">
                  <i className="fa-solid fa-user"></i>
                  <input type="text" id="cf-name" name="name" value={formData.name} onChange={handleChange} placeholder="Full name" required disabled={loading} />
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="cf-phone">Phone number</label>
                <div className="input-wrap">
                  <i className="fa-solid fa-phone"></i>
                  <input type="tel" id="cf-phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91" required disabled={loading} />
                </div>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="cf-company">Company name</label>
              <div className="input-wrap">
                <i className="fa-solid fa-building"></i>
                <input type="text" id="cf-company" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Your organization" required disabled={loading} />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="cf-size">Employee count</label>
              <div className="input-wrap">
                <i className="fa-solid fa-users"></i>
                <select id="cf-size" name="employeeCount" value={formData.employeeCount} onChange={handleChange} required disabled={loading}>
                  <option value="">Select range</option>
                  <option value="1-10">1-10</option>
                  <option value="11-25">11-25</option>
                  <option value="26-50">26-50</option>
                  <option value="51-100">51-100</option>
                  <option value="101-250">101-250</option>
                  <option value="251-500">251-500</option>
                  <option value="500+">500+</option>
                </select>
                <i className="fa-solid fa-chevron-down select-arrow"></i>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="cf-message">Message</label>
              <div className="input-wrap" style={{ height: "auto", minHeight: "100px", padding: "10px" }}>
                <textarea 
                  id="cf-message" 
                  name="message" 
                  value={formData.message} 
                  onChange={handleChange} 
                  placeholder="Tell us about your HR challenges, attendance tracking, payroll workflow, workforce management needs, or any specific requirements." 
                  required 
                  disabled={loading}
                  style={{ width: "100%", height: "100px", border: "none", background: "transparent", outline: "none", resize: "none", fontSize: "14px", fontFamily: "inherit" }}
                ></textarea>
              </div>
            </div>

            <button type="submit" className="btn btn-form-submit" disabled={loading}>
              {loading ? (
                <><i className="fa-solid fa-circle-notch fa-spin"></i> Submitting...</>
              ) : (
                <>Book my demo <i className="fa-solid fa-arrow-right"></i></>
              )}
            </button>
            
            <div className="form-privacy">
              <i className="fa-solid fa-lock"></i> Your information is private and never shared.
            </div>
          </div>
        )}
      </form>
    </>
  );
}
