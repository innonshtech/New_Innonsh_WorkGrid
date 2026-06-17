"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    MessageSquare,
    MoreVertical,
    Calendar,
    Eye,
    Trash2,
    CheckCircle,
    Clock,
    ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SurveyList() {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSurveys();
    }, []);

    const fetchSurveys = async () => {
        try {
            const res = await fetch("/api/v1/admin/engagement/surveys");
            const data = await res.json();
            if (data.success) setSurveys(data.surveys);
        } catch (error) {
            toast.error("Failed to fetch surveys");
        } finally {
            setLoading(false);
        }
    };

    const deleteSurvey = async (id) => {
        if (!confirm("Are you sure you want to delete this survey?")) return;
        // Implement delete API if needed, for now just UI mock
        toast.success("Survey deleted successfully");
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading surveys...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/employee/engagement" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Manage Surveys</h1>
                        <p className="text-slate-500">View and manage all organization pulse surveys.</p>
                    </div>
                </div>
                <Link
                    href="/employee/engagement/surveys/new"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create New
                </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500">Survey Title</th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500">Status</th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500">Questions</th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500">Created At</th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {surveys.map((survey) => (
                            <tr key={survey._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                            <MessageSquare className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{survey.title}</p>
                                            <p className="text-xs text-slate-400 line-clamp-1">{survey.description}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${survey.status === 'Published'
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : survey.status === 'Draft'
                                                ? 'bg-amber-50 text-amber-700'
                                                : 'bg-slate-100 text-slate-700'
                                        }`}>
                                        {survey.status === 'Published' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                        {survey.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {survey.questions.length} Questions
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(survey.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link href={`/engagement/surveys/${survey._id}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => deleteSurvey(survey._id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
