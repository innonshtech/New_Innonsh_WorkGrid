"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Trash2,
    Save,
    ArrowLeft,
    Settings2,
    Calendar,
    Target
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewSurvey() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status: "Draft",
        activeUntil: "",
        isAnonymous: false,
        isEnps: false,
        questions: [
            { text: "On a scale of 0 to 10, how likely are you to recommend this company as a place to work?", type: "rating", required: true }
        ]
    });

    const addQuestion = () => {
        setFormData({
            ...formData,
            questions: [...formData.questions, { text: "", type: "rating", required: true }]
        });
    };

    const removeQuestion = (index) => {
        const newQuestions = formData.questions.filter((_, i) => i !== index);
        setFormData({ ...formData, questions: newQuestions });
    };

    const updateQuestion = (index, field, value) => {
        const newQuestions = [...formData.questions];
        newQuestions[index][field] = value;
        setFormData({ ...formData, questions: newQuestions });
    };

    const submitSurvey = async (status) => {
        if (formData.questions.some(q => !q.text)) {
            toast.error("All questions must have text");
            return;
        }

        try {
            setLoading(true);
            const finalData = { ...formData, status };
            const res = await fetch("/api/v1/admin/engagement/surveys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalData),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(`Survey ${status === 'Published' ? 'published' : 'saved as draft'} successfully`);
                router.push("/admin/engagement");
            } else {
                toast.error(data.message || "Failed to create survey");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/engagement" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Create New Pulse Survey</h1>
                    <p className="text-slate-500">Design a survey to collect employee feedback.</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Survey Title</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g., Weekly Pulse Check"
                            className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Description</label>
                        <textarea
                            rows={2}
                            placeholder="Give employees some context about this survey..."
                            className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-slate-500 block">Active Until (Optional)</label>
                                <input
                                    type="date"
                                    className="w-full text-sm outline-none bg-transparent"
                                    value={formData.activeUntil}
                                    onChange={(e) => setFormData({ ...formData, activeUntil: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                            <div className="flex items-center gap-2">
                                <Settings2 className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-600">Anonymous Responses</span>
                            </div>
                            <input
                                type="checkbox"
                                className="w-4 h-4 accent-indigo-600"
                                checked={formData.isAnonymous}
                                onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
                            <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-indigo-500" />
                                <div>
                                    <span className="text-sm font-semibold text-indigo-900 block">eNPS Survey</span>
                                    <span className="text-[10px] text-indigo-600">Track loyalty & recommendation scores</span>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                className="w-4 h-4 accent-indigo-600"
                                checked={formData.isEnps}
                                onChange={(e) => setFormData({ ...formData, isEnps: e.target.checked })}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-slate-800">Questions</h2>
                        <button
                            type="button"
                            onClick={addQuestion}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" />
                            Add Question
                        </button>
                    </div>

                    {formData.questions.map((q, index) => (
                        <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 relative group">
                            <button
                                type="button"
                                onClick={() => removeQuestion(index)}
                                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Question {index + 1}</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ask something..."
                                        className="w-full text-lg font-medium text-slate-800 border-b border-slate-100 focus:border-indigo-500 outline-none pb-1"
                                        value={q.text}
                                        onChange={(e) => updateQuestion(index, "text", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Input Type</label>
                                    <select
                                        className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none"
                                        value={q.type}
                                        onChange={(e) => updateQuestion(index, "type", e.target.value)}
                                    >
                                        <option value="rating">Rating (1-5)</option>
                                        <option value="text">Free Text</option>
                                        <option value="boolean">Yes/No</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3 pt-6">
                    <button
                        type="button"
                        onClick={() => submitSurvey("Draft")}
                        disabled={loading}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${formData.status === 'Draft' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        Save as Draft
                    </button>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => submitSurvey("Published")}
                        className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? "Publishing..." : "Publish Survey"}
                    </button>
                </div>
            </div>
        </div>
    );
}
