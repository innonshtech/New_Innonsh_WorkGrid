"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import LeadCaptureForm from "./LeadCaptureForm";

export default function LandingPageClient({ initialHtml }) {
  const router = useRouter();
  const { user, loading } = useSession();
  const [redirecting, setRedirecting] = useState(true);
  const [formContainer, setFormContainer] = useState(null);

  // 1. Session-based redirection for authenticated users
  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === "super_admin") {
          router.push("/super-admin/dashboard");
        } else if (["admin", "company_admin", "hr"].includes(user.role)) {
          router.push("/admin/dashboard");
        } else if (user.role === "employee") {
          router.push("/employee/dashboard");
        } else if (user.role === "attendance_only") {
          router.push("/admin/attendance");
        } else {
          setRedirecting(false);
        }
      } else {
        setRedirecting(false);
      }
    }
  }, [user, loading, router]);

  // 2. Initialize interactive JavaScript behaviors from the portfolio on mount
  useEffect(() => {
    if (redirecting) return;

    // --- NAV SCROLL BG CHANGE ---
    const nav = document.getElementById("nav");
    const handleScroll = () => {
      if (window.scrollY > 12) {
        nav?.classList.add("scrolled");
      } else {
        nav?.classList.remove("scrolled");
      }
    };
    window.addEventListener("scroll", handleScroll);

    // --- MODULE TABS SWITCHING ---
    const tabs = document.querySelectorAll(".modules-tabs .tab");
    const cards = document.querySelectorAll(".module-card");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const cat = tab.getAttribute("data-cat");
        cards.forEach((c) => {
          c.classList.remove("visible");
          if (c.getAttribute("data-cat") === cat) {
            setTimeout(() => c.classList.add("visible"), 30);
          }
        });
      });
    });

    // --- INTERSECTION OBSERVER FOR REVEAL ANIMATIONS ---
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    // --- COUNTER STATS ANIMATION ---
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.getAttribute("data-count"));
            const original = el.textContent;
            let current = 0;
            const duration = 1400;
            const steps = 40;
            const inc = target / steps;
            const interval = duration / steps;
            const t = setInterval(() => {
              current += inc;
              if (current >= target) {
                el.textContent = original;
                clearInterval(t);
              } else {
                const suffix = original.replace(/[\d,]/g, "").trim();
                const formatted = Math.floor(current).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' });
                el.textContent =
                  suffix && !/^\d/.test(suffix)
                    ? formatted +
                      (suffix.startsWith("%") || suffix.startsWith("+")
                        ? suffix
                        : " " + suffix)
                    : formatted;
              }
            }, interval);
            counterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll("[data-count]").forEach((el) =>
      counterObserver.observe(el)
    );

    // --- ATTENDANCE CALENDAR RENDERER ---
    const cal = document.getElementById("attCalendar");
    if (cal && cal.children.length === 0) {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      days.forEach((d) => {
        const h = document.createElement("div");
        h.style.cssText =
          "font-size:10px; font-weight:600; color:var(--text-soft); text-align:center; padding-bottom:4px;";
        h.textContent = d;
        cal.appendChild(h);
      });

      const states = [
        "present", "present", "present", "present", "present", "weekend", "weekend",
        "present", "present", "wfh", "present", "present", "weekend", "weekend",
        "leave", "present", "present", "present", "present", "weekend", "weekend",
        "present", "wfh", "present", "present", "today", "weekend", "weekend",
        "absent", "present", "present", "present", "present", "weekend", "weekend"
      ];
      for (let i = 0; i < 35; i++) {
        const d = document.createElement("div");
        d.className = "att-day " + states[i];
        d.textContent = i + 1;
        cal.appendChild(d);
      }
    }

    // --- SMOOTH SCROLL ANCHORS ---
    const anchorHandler = (e) => {
      const href = e.currentTarget.getAttribute("href");
      if (href && href.startsWith("#") && href !== "#") {
        e.preventDefault();
        const target = document.querySelector(href);
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", anchorHandler);
    });

    // --- MOBILE MENU TOGGLE ---
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    const handleMenuClick = () => {
      navLinks?.classList.toggle("active");
    };
    menuToggle?.addEventListener("click", handleMenuClick);

    // --- DYNAMIC DEMO REQUEST FORM SUBMISSION ---
    // Instead of raw JS form submission, we now use a React Portal.
    // Clean out the existing form HTML safely, then mount the React form.
    const contactRightNode = document.querySelector(".contact-right");
    if (contactRightNode && !formContainer) {
      contactRightNode.innerHTML = "";
      setFormContainer(contactRightNode);
    }

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.removeEventListener("click", anchorHandler);
      });
      menuToggle?.removeEventListener("click", handleMenuClick);
    };
  }, [redirecting, formContainer]);

  if (loading || redirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium">Loading Innonsh WorkGrid...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        dangerouslySetInnerHTML={{ __html: initialHtml }}
        style={{ width: "100%", height: "100%" }}
      />
      {formContainer && createPortal(<LeadCaptureForm />, formContainer)}
    </>
  );
}
