"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, PartyPopper, ArrowRight } from "lucide-react";

function OfferResponseContent() {
    const searchParams = useSearchParams();
    const candidateId = searchParams.get('id');
    const email = searchParams.get('email');
    const action = searchParams.get('action'); // 'accept' or 'decline'
    const [status, setStatus] = useState('loading'); // loading | success | error | confirming
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!candidateId || !email || !action) {
            setStatus('error');
            setMessage('Invalid link. Please use the link from your offer letter email.');
            return;
        }

        if (!['accept', 'decline'].includes(action)) {
            setStatus('error');
            setMessage('Invalid action in the link.');
            return;
        }

        // Show confirmation screen first (don't auto-submit)
        setStatus('confirming');
    }, [candidateId, email, action]);

    const handleConfirm = async () => {
        try {
            setStatus('loading');
            const res = await fetch('/api/v1/public/careers/offer-response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidateId, email, action })
            });

            const data = await res.json();
            if (data.success) {
                setStatus('success');
                setMessage(data.message);
            } else {
                setStatus('error');
                setMessage(data.error || 'Something went wrong.');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Network error. Please try again or contact HR.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[40px] border border-slate-200 max-w-lg w-full overflow-hidden"
            >
                {/* Loading */}
                {status === 'loading' && (
                    <div className="p-16 text-center space-y-6">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
                        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Processing your response...</p>
                    </div>
                )}

                {/* Confirmation Screen */}
                {status === 'confirming' && action === 'accept' && (
                    <div className="text-center">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-10">
                            <PartyPopper className="w-16 h-16 text-white mx-auto mb-4" />
                            <h1 className="text-3xl font-black text-white tracking-tight">Accept Your Offer</h1>
                            <p className="text-emerald-100 font-medium mt-2">One click to begin your journey with us</p>
                        </div>
                        <div className="p-10 space-y-6">
                            <p className="text-slate-600 font-medium leading-relaxed">
                                By clicking the button below, you are officially accepting the offer. Our HR team will be notified and will reach out with onboarding details.
                            </p>
                            <button
                                onClick={handleConfirm}
                                className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Yes, I Accept the Offer
                            </button>
                            <a
                                href={`/careers/offer?id=${candidateId}&email=${encodeURIComponent(email)}&action=decline`}
                                className="block text-center text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-rose-500 transition-colors"
                            >
                                I'd like to decline instead
                            </a>
                        </div>
                    </div>
                )}

                {status === 'confirming' && action === 'decline' && (
                    <div className="text-center">
                        <div className="bg-gradient-to-br from-slate-600 to-slate-800 p-10">
                            <XCircle className="w-16 h-16 text-white mx-auto mb-4" />
                            <h1 className="text-3xl font-black text-white tracking-tight">Decline Offer</h1>
                            <p className="text-slate-300 font-medium mt-2">Are you sure you want to decline?</p>
                        </div>
                        <div className="p-10 space-y-6">
                            <p className="text-slate-600 font-medium leading-relaxed">
                                We understand this is a big decision. If you have any questions or concerns, feel free to reach out to our HR team before making your final decision.
                            </p>
                            <button
                                onClick={handleConfirm}
                                className="w-full h-16 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3"
                            >
                                <XCircle className="w-5 h-5" />
                                Confirm Decline
                            </button>
                            <a
                                href={`/careers/offer?id=${candidateId}&email=${encodeURIComponent(email)}&action=accept`}
                                className="block text-center text-emerald-600 text-xs font-bold uppercase tracking-widest hover:text-emerald-700 transition-colors"
                            >
                                Wait — I want to accept instead →
                            </a>
                        </div>
                    </div>
                )}

                {/* Success */}
                {status === 'success' && (
                    <div className="text-center">
                        <div className={`p-10 ${action === 'accept' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-slate-500 to-slate-700'}`}>
                            {action === 'accept' 
                                ? <CheckCircle2 className="w-16 h-16 text-white mx-auto mb-4" />
                                : <XCircle className="w-16 h-16 text-white mx-auto mb-4" />
                            }
                            <h1 className="text-3xl font-black text-white tracking-tight">
                                {action === 'accept' ? 'Welcome Aboard! 🎉' : 'Offer Declined'}
                            </h1>
                        </div>
                        <div className="p-10 space-y-6">
                            <p className="text-slate-600 font-medium leading-relaxed">{message}</p>
                            <a
                                href="/careers/status"
                                className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest hover:text-indigo-700 transition-colors"
                            >
                                View your application status <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                )}

                {/* Error */}
                {status === 'error' && (
                    <div className="p-16 text-center space-y-6">
                        <div className="w-16 h-16 rounded-3xl bg-rose-100 flex items-center justify-center mx-auto">
                            <XCircle className="w-8 h-8 text-rose-500" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900">Something Went Wrong</h2>
                        <p className="text-slate-500 font-medium">{message}</p>
                        <a
                            href="/careers/status"
                            className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest hover:text-indigo-700 transition-colors"
                        >
                            Check your status manually <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

export default function OfferResponsePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="p-16 text-center space-y-6">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Loading...</p>
                </div>
            </div>
        }>
            <OfferResponseContent />
        </Suspense>
    );
}
