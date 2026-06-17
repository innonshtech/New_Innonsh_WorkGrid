"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Briefcase,
  Users,
  Cpu,
  GitGraph,
  Check,
} from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Onboard Clients",
    icon: Building2,
    href: "/admin/staffing/clients",
    description: "Partner Directory",
  },
  {
    number: 2,
    title: "Job Requirements",
    icon: Briefcase,
    href: "/admin/staffing/requirements",
    description: "Requisitions",
  },
  {
    number: 3,
    title: "Sourcing Pool",
    icon: Users,
    href: "/admin/staffing/talent-pool",
    description: "Resume Bank",
  },
  {
    number: 4,
    title: "AI Match Workspace",
    icon: Cpu,
    href: "/admin/staffing/matching",
    description: "Fit Scoring",
  },
  {
    number: 5,
    title: "Hiring Kanban Board",
    icon: GitGraph,
    href: "/admin/staffing/submissions",
    description: "Pipeline Tracker",
  },
];

export default function StaffingStepper({ currentStep = 1 }) {
  const router = useRouter();

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 p-6 mb-6 overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute -right-16 -top-16 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl"></div>
      <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl"></div>

      <div className="relative z-10 flex flex-col gap-6">
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <h4 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              Sourcing Sourcing Guide
            </h4>
            <p className="text-[11px] font-semibold text-slate-400">Follow the serial pipeline steps to onboard and deploy candidates</p>
          </div>
          <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full w-fit">
            Active: Step {currentStep} of 5
          </div>
        </div>

        {/* Steps container */}
        <div className="relative w-full">
          {/* Connecting Line - only on xl screens and above */}
          <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-slate-100 -z-10 hidden xl:block">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 ease-in-out"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>

          {/* Steps List */}
          <div className="flex overflow-x-auto xl:grid xl:grid-cols-5 gap-6 xl:gap-4 no-scrollbar pb-2 xl:pb-0 snap-x snap-mandatory scroll-smooth">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = step.number === currentStep;
              const isCompleted = step.number < currentStep;

              return (
                <div
                  key={step.number}
                  onClick={() => router.push(step.href)}
                  className="flex-1 min-w-[170px] xl:min-w-0 flex flex-col items-center text-center cursor-pointer group snap-center select-none"
                >
                  {/* Step bubble */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 transform group-hover:scale-105 active:scale-95 ${
                      isActive
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                        : isCompleted
                        ? "bg-emerald-500 text-white"
                        : "bg-white border-2 border-slate-200 text-slate-400 group-hover:border-slate-300 group-hover:text-slate-500"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>

                  {/* Label description */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-center gap-1">
                      <span className={`text-[9px] font-black tracking-wider uppercase ${
                        isActive ? "text-indigo-600" : isCompleted ? "text-emerald-600" : "text-slate-400"
                      }`}>
                        Step {step.number}
                      </span>
                      {isCompleted && (
                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1 rounded uppercase tracking-wider">Done</span>
                      )}
                    </div>
                    <p
                      className={`text-xs font-black transition-colors ${
                        isActive
                          ? "text-slate-900 font-extrabold"
                          : isCompleted
                          ? "text-slate-600"
                          : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 leading-none">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
