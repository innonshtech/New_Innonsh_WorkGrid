"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    TrendingUp,
    Users,
    MessageSquare,
    BarChart,
    Layout
} from "lucide-react";
import Link from "next/link";

export default function SurveyStats() {
    const { id } = useParams();
    const [survey, setSurvey] = useState(null);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSurveyDetails();
    }, [id]);

    const fetchSurveyDetails = async () => {
        try {
            setLoading(true);
            // Fetch survey metadata
            const surveyRes = await fetch("/api/v1/admin/engagement/surveys");
            const surveyData = await surveyRes.json();
            if (surveyData.success) {
                const found = surveyData.surveys.find(s => s._id === id);
                setSurvey(found);
            }

            // Fetch survey responses
            const responseRes = await fetch(`/api/v1/admin/engagement/responses?surveyId=${id}`);
            const responseData = await responseRes.json();
            if (responseData.success) {
                setResponses(responseData.responses);
            }
        } catch (error) {
            console.error("Failed to fetch survey details:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading survey details...</div>;
    if (!survey) return <div className="p-8 text-center text-slate-500">Survey not found.</div>;

    const avgScore = responses.length > 0
        ? (responses.reduce((sum, r) => sum + r.engagementScore, 0) / responses.length).toFixed(1)
        : "0.0";

    return (
        <div className="p-6 space-y-8 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/employee/engagement" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{survey.title}</h1>
                    <p className="text-slate-500">{survey.description}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Average Score"
                    value={avgScore}
                    icon={TrendingUp}
                    color="text-emerald-600"
                    bgColor="bg-emerald-50"
                />
                <StatCard
                    title="Total Responses"
                    value={responses.length}
                    icon={Users}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                />
                <StatCard
                    title="Questions"
                    value={survey.questions.length}
                    icon={MessageSquare}
                    color="text-indigo-600"
                    bgColor="bg-indigo-50"
                />
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800">Individual Feedback</h2>
                <div className="grid gap-4">
                    {responses.length > 0 ? (
                        responses.map((resp, i) => (
                            <ResponseCard key={i} response={resp} questions={survey.questions} isAnonymous={survey.isAnonymous} />
                        ))
                    ) : (
                        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
                            <p className="text-slate-400">No responses yet for this survey.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bgColor }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className={`${bgColor} ${color} w-10 h-10 rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-medium text-slate-500">{title}</h3>
            <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
    );
}

function ResponseCard({ response, questions, isAnonymous }) {
    const userName = isAnonymous ? "Anonymous Employee" :
        `${response.employeeId?.personalDetails?.firstName} ${response.employeeId?.personalDetails?.lastName}`;

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                        {isAnonymous ? <Layout className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-800">{userName}</h4>
                        <p className="text-xs text-slate-400">{new Date(response.submittedAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Engagement Score</p>
                    <p className="text-lg font-bold text-indigo-600">{response.engagementScore.toFixed(1)}/10</p>
                </div>
            </div>

            <div className="space-y-3">
                {response.responses.map((ans, idx) => {
                    const qText = questions.find(q => q._id === ans.questionId)?.text || "Question";
                    return (
                        <div key={idx} className="space-y-1">
                            <p className="text-sm text-slate-500 font-medium">{qText}</p>
                            <p className="text-sm text-slate-800 bg-slate-50 p-2 rounded-lg">{ans.answer}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
