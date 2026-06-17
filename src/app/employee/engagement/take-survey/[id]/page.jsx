"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Send,
    CheckCircle2,
    Info
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function TakeSurvey() {
    const { id } = useParams();
    const router = useRouter();
    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        fetchSurvey();
    }, [id]);

    const fetchSurvey = async () => {
        try {
            const res = await fetch("/api/v1/admin/engagement/surveys");
            const data = await res.json();
            if (data.success) {
                const found = data.surveys.find(s => s._id === id);
                if (found) {
                    setSurvey(found);
                    // Initialize answers
                    const initial = {};
                    found.questions.forEach(q => {
                        initial[q._id] = q.type === 'rating' ? 3 : '';
                    });
                    setAnswers(initial);
                }
            }
        } catch (error) {
            toast.error("Failed to load survey");
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (qid, val) => {
        setAnswers({ ...answers, [qid]: val });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const responses = Object.entries(answers).map(([qid, ans]) => ({
                questionId: qid,
                answer: ans
            }));

            const res = await fetch("/api/v1/admin/engagement/responses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    surveyId: id,
                    responses
                }),
            });

            const data = await res.json();
            if (data.success) {
                setSubmitted(true);
                toast.success("Response submitted! Thank you.");
            } else {
                toast.error(data.message || "Failed to submit response");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500">Loading survey...</div>;
    if (!survey) return <div className="p-12 text-center text-slate-500">Survey not found.</div>;

    if (submitted) {
        return (
            <div className="p-12 max-w-xl mx-auto text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Thank You!</h1>
                    <p className="text-slate-500 mt-2">Your feedback has been recorded. We appreciate your time and honesty.</p>
                </div>
                <Link
                    href="/employee/engagement"
                    className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all"
                >
                    Back to Engagement Hub
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/employee/engagement" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{survey.title}</h1>
                    <p className="text-slate-500">{survey.description}</p>
                </div>
            </div>

            {survey.isAnonymous && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 text-blue-700">
                    <Info className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">This survey is anonymous. Your identity will not be linked to your responses.</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {survey.questions.map((q, index) => (
                    <div key={q._id} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800">
                            <span className="text-indigo-500 mr-2">{index + 1}.</span>
                            {q.text}
                        </h3>

                        {q.type === 'rating' && (
                            <div className="flex justify-between items-center max-w-md mx-auto pt-4">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => handleAnswer(q._id, num)}
                                        className={`w-12 h-12 rounded-full font-bold transition-all ${answers[q._id] === num
                                                ? 'bg-indigo-600 text-white scale-110'
                                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        )}

                        {q.type === 'boolean' && (
                            <div className="flex gap-4 pt-2">
                                {['Yes', 'No'].map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => handleAnswer(q._id, opt)}
                                        className={`flex-1 py-3 rounded-xl font-semibold border transition-all ${answers[q._id] === opt
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {q.type === 'text' && (
                            <textarea
                                required={q.required}
                                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                                placeholder="Type your answer here..."
                                value={answers[q._id]}
                                onChange={(e) => handleAnswer(q._id, e.target.value)}
                            />
                        )}
                    </div>
                ))}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                    <Send className="w-5 h-5" />
                    {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
            </form>
        </div>
    );
}
