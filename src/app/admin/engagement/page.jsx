"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/context/SessionContext";
import { useLanguage } from "@/context/LanguageContext";
import {
    BarChart3,
    MessageSquare,
    Users,
    TrendingUp,
    Clock,
    CheckCircle2,
    ChevronRight,
    Plus,
    Target
} from "lucide-react";
import Link from "next/link";

export default function EngagementHub() {
    const { user } = useSession();
    const { t } = useLanguage();
    const [stats, setStats] = useState(null);
    const [enpsData, setEnpsData] = useState(null);
    const [activeSurveys, setActiveSurveys] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEngagementData();
    }, []);

    const fetchEngagementData = async () => {
        try {
            setLoading(true);
            // Fetch stats for admin
            if (user?.role === 'admin') {
                const statsRes = await fetch('/api/v1/admin/engagement/scores');
                const statsData = await statsRes.json();
                if (statsData.success) setStats(statsData.stats);

                const enpsRes = await fetch('/api/v1/admin/engagement/enps');
                const enpsResult = await enpsRes.json();
                if (enpsResult.success) setEnpsData(enpsResult);
            }

            // Fetch surveys for everyone
            const surveyRes = await fetch('/api/v1/admin/engagement/surveys');
            const surveyData = await surveyRes.json();
            if (surveyData.success) {
                const active = surveyData.surveys.filter(s => s.status === 'Published');
                setActiveSurveys(active);
            }
        } catch (error) {
            console.error("Failed to fetch engagement data:", error);
        } finally {
            setLoading(false);
        }
    };

    const responseCounts = stats ? stats.reduce((acc, curr) => {
        acc[curr._id] = curr.totalResponses;
        return acc;
    }, {}) : {};

    if (loading) return <div className="p-8 text-center text-slate-500">Loading engagement data...</div>;

    return (
        <div className="p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t("engagementHub")}</h1>
                    <p className="text-slate-500">
                        {user?.role === 'admin'
                            ? "Monitor and improve employee engagement across the organization."
                            : "Share your feedback and see how we're building a better workplace together."}
                    </p>
                </div>
                {user?.role === 'admin' && (
                    <Link
                        href="/admin/engagement/surveys/new"
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        {t("createSurvey")}
                    </Link>
                )}
            </div>

            {user?.role === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title={t("avgEngagementScore")}
                        value={stats?.[0]?.averageScore?.toFixed(1) || "0.0"}
                        icon={TrendingUp}
                        color="text-emerald-600"
                        bgColor="bg-emerald-50"
                        subtext={t("acrossAllSurveys") || "Across all surveys"}
                    />
                    <StatCard
                        title={t("participationRate")}
                        value={`${stats?.[0]?.totalResponses || 0}`}
                        icon={Users}
                        color="text-blue-600"
                        bgColor="bg-blue-50"
                        subtext={t("totalResponses")}
                    />
                    <StatCard
                        title={t("activeSurveys")}
                        value={activeSurveys.length}
                        icon={MessageSquare}
                        color="text-indigo-600"
                        bgColor="bg-indigo-50"
                        subtext={t("currentlyOpen") || "Currently open"}
                    />
                    <StatCard
                        title={t("responseRate")}
                        value="85%"
                        icon={CheckCircle2}
                        color="text-amber-600"
                        bgColor="bg-amber-50"
                        subtext="Target: 90%"
                    />
                </div>
            )}

            {user?.role === 'admin' && enpsData && (
                <section className="bg-white p-8 rounded-2xl border border-slate-200">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Target className="w-5 h-5 text-indigo-600" />
                                {t("eNPSDetail")}
                            </h2>
                            <p className="text-sm text-slate-500">{t("eNPSSubtitle") || "How likely employees are to recommend your workplace."}</p>
                        </div>
                        <div className={`px-6 py-3 rounded-2xl text-center ${enpsData.enps > 30 ? 'bg-emerald-50 text-emerald-700' : enpsData.enps > 0 ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'}`}>
                            <p className="text-xs font-bold uppercase tracking-widest mb-1">{t("averageENPS")}</p>
                            <p className="text-4xl font-black">{enpsData.enps}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-bold text-slate-600">
                                    <span>Promoters (9-10)</span>
                                    <span>{enpsData.breakdown.promoterPct}%</span>
                                </div>
                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${enpsData.breakdown.promoterPct}%` }} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-bold text-slate-600">
                                    <span>Passives (7-8)</span>
                                    <span>{enpsData.breakdown.passivePct}%</span>
                                </div>
                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-400 rounded-full transition-all duration-1000" style={{ width: `${enpsData.breakdown.passivePct}%` }} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-bold text-slate-600">
                                    <span>Detractors (0-6)</span>
                                    <span>{enpsData.breakdown.detractorPct}%</span>
                                </div>
                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${enpsData.breakdown.detractorPct}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-tight">Quick Insights</h3>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                                    <p className="text-sm text-slate-600"><strong>{enpsData.breakdown.promoters}</strong> employees are active advocates of your culture.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                                    <p className="text-sm text-slate-600">Typical eNPS for High-Growth tech is between 20 and 50.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                                    <p className="text-sm text-slate-600">Focus on converting "Passives" to "Promoters" to drive organic growth.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <section>
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            Active Surveys
                        </h2>
                        <div className="grid gap-4">
                            {activeSurveys.length > 0 ? (
                                activeSurveys.map(survey => (
                                    <SurveyRow
                                        key={survey._id}
                                        survey={survey}
                                        role={user?.role}
                                        responseCount={responseCounts[survey._id] || 0}
                                    />
                                ))
                            ) : (
                                <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
                                    <p className="text-slate-400">No active surveys at the moment.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <section className="bg-white p-6 rounded-xl border border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Engagement Tips</h2>
                        <div className="space-y-4">
                            <TipItem
                                title="Regular Feedback"
                                text="Participate in weekly pulse checks to help us understand the mood."
                            />
                            <TipItem
                                title="Honest Voice"
                                text="Your feedback is key to driving positive changes in our culture."
                            />
                            <TipItem
                                title="Action Oriented"
                                text="We review every response to improve your daily experience."
                            />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bgColor, subtext }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
                <div className={`${bgColor} ${color} p-2 rounded-lg`}>
                    <Icon className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
            <h3 className="text-sm font-medium text-slate-500">{title}</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
            {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
    );
}

function SurveyRow({ survey, role, responseCount }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors gap-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                    <MessageSquare className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h4 className="font-semibold text-slate-800">{survey.title}</h4>
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-500 line-clamp-1">{survey.description}</p>
                        {role === 'admin' && (
                            <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                                <Users className="w-2.5 h-2.5" />
                                {responseCount} Submissions
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {role === 'admin' ? (
                    <Link
                        href={`/admin/engagement/surveys/${survey._id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5 bg-indigo-50 rounded-lg whitespace-nowrap"
                    >
                        View Stats
                    </Link>
                ) : (
                    <Link
                        href={`/employee/engagement/take-survey/${survey._id}`}
                        className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-all whitespace-nowrap"
                    >
                        Take Survey
                    </Link>
                )}
            </div>
        </div>
    );
}

function TipItem({ title, text }) {
    return (
        <div className="flex gap-3">
            <div className="mt-1">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
            </div>
            <div>
                <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{text}</p>
            </div>
        </div>
    );
}
