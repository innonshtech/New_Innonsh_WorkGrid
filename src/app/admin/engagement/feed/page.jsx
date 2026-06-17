"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/context/SessionContext";
import {
    Heart,
    MessageCircle,
    Send,
    Award,
    User,
    Image as ImageIcon,
    MoreHorizontal,
    Megaphone,
    Plus
} from "lucide-react";
import { toast } from "sonner";

export default function SocialFeed() {
    const { user } = useSession();
    const [posts, setPosts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState({ content: "", type: "post", shoutoutTo: "" });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchFeed();
        fetchEmployees();
    }, []);

    const fetchFeed = async () => {
        try {
            const res = await fetch("/api/v1/admin/engagement/shout-outs");
            const data = await res.json();
            if (data.success) setPosts(data.posts);
        } catch (error) {
            toast.error("Failed to load feed");
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch("/api/v1/admin/payroll/employees?limit=1000");
            const resData = await res.json();
            if (resData.success) setEmployees(resData.data || resData.employees || []);
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!newPost.content) return;

        try {
            setSubmitting(true);
            const res = await fetch("/api/v1/admin/engagement/shout-outs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newPost),
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Posted successfully!");
                setNewPost({ content: "", type: "post", shoutoutTo: "" });
                fetchFeed();
            } else {
                toast.error(data.message || "Failed to post");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleLike = async (postId) => {
        try {
            const res = await fetch(`/api/v1/admin/engagement/shout-outs/${postId}/like`, { method: "POST" });
            const data = await res.json();
            if (data.success) {
                setPosts(posts.map(p => p._id === postId ? {
                    ...p,
                    likes: p.likes.includes(user.id)
                        ? p.likes.filter(id => id !== user.id)
                        : [...p.likes, user.id]
                } : p));
            }
        } catch (error) {
            toast.error("Action failed");
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading social feed...</div>;

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-indigo-600" />
                    Social Feed
                </h1>
                <p className="text-sm text-slate-500 hidden sm:block">Connect with your colleagues</p>
            </div>

            {/* Create Post Area */}
            <form onSubmit={handlePostSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                        <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-3">
                        <textarea
                            placeholder={newPost.type === 'shoutout' ? "Who are you shouting out today?" : "What's on your mind?"}
                            className="w-full text-slate-800 outline-none resize-none min-h-[80px]"
                            value={newPost.content}
                            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                        />

                        {newPost.type === 'shoutout' && (
                            <div className="flex flex-col sm:flex-row gap-2">
                                <select
                                    className="p-2 rounded-lg border border-slate-200 text-sm outline-none bg-slate-50/50"
                                    value={newPost.shoutoutTo}
                                    required
                                    onChange={(e) => setNewPost({ ...newPost, shoutoutTo: e.target.value })}
                                >
                                    <option value="">Select colleague...</option>
                                    {employees.map(emp => (
                                        <option key={emp._id} value={emp._id}>
                                            {emp.personalDetails.firstName} {emp.personalDetails.lastName}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 italic text-xs">
                                    <Award className="w-3.5 h-3.5" />
                                    Recognizing excellence!
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setNewPost({ ...newPost, type: 'post', shoutoutTo: '' })}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${newPost.type === 'post' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Post Update
                        </button>
                        <button
                            type="button"
                            onClick={() => setNewPost({ ...newPost, type: 'shoutout' })}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${newPost.type === 'shoutout' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Award className="w-4 h-4 text-amber-500" />
                            Public Shout-Out
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={submitting || !newPost.content || (newPost.type === 'shoutout' && !newPost.shoutoutTo)}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        {submitting ? "Posting..." : "Share"}
                    </button>
                </div>
            </form>

            {/* Feed */}
            <div className="space-y-6">
                {posts.length > 0 ? (
                    posts.map(post => (
                        <PostCard key={post._id} post={post} user={user} onLike={() => toggleLike(post._id)} />
                    ))
                ) : (
                    <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-400 font-medium italic">The feed is quiet. Start the conversation!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function PostCard({ post, user, onLike }) {
    const isLiked = post.likes.includes(user.id);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText) return;

        try {
            setSubmittingComment(true);
            const res = await fetch(`/api/v1/admin/engagement/shout-outs/${post._id}/comment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: commentText }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Comment added!");
                setCommentText("");
                // Optimistic UI or re-fetch (simplifying to just UI notify for now)
            }
        } catch (error) {
            toast.error("Failed to add comment");
        } finally {
            setSubmittingComment(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col group">
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">
                                {post.author ? `${post.author.personalDetails.firstName} ${post.author.personalDetails.lastName}` : 'Admin Team'}
                                {post.announcementByAdmin && (
                                    <span className="ml-2 text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter align-middle">
                                        Admin
                                    </span>
                                )}
                            </p>
                            <p className="text-xs text-slate-400">
                                {new Date(post.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                    <button className="text-slate-300 hover:text-slate-500 transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-3">
                    {post.type === 'shoutout' && (
                        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border-l-4 border-amber-400">
                            <div className="bg-white p-2 rounded-full">
                                <Award className="w-6 h-6 text-amber-500 animate-pulse" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-800 italic">
                                    Giving a big shout-out to {post.shoutoutTo?.personalDetails?.firstName} {post.shoutoutTo?.personalDetails?.lastName}!
                                </p>
                                <p className="text-xs text-amber-600 mt-0.5">Recognition for great work.</p>
                            </div>
                        </div>
                    )}

                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {post.content}
                    </p>
                </div>
            </div>

            <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center gap-6">
                <button
                    onClick={onLike}
                    className={`flex items-center gap-1.5 text-sm font-semibold transition-all ${isLiked ? 'text-rose-500 scale-105' : 'text-slate-500 hover:text-rose-500'}`}
                >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    {post.likes.length > 0 && <span>{post.likes.length}</span>}
                    {isLiked ? 'Liked' : 'Like'}
                </button>
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 text-sm font-semibold transition-colors"
                >
                    <MessageCircle className="w-4 h-4" />
                    {post.comments.length > 0 && <span>{post.comments.length}</span>}
                    Comments
                </button>
            </div>

            {showComments && (
                <div className="px-6 pb-6 bg-slate-50/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-2 pt-2">
                        {post.comments.map((comment, idx) => (
                            <div key={idx} className="flex gap-2">
                                <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
                                    <User className="w-3 h-3 text-slate-400" />
                                </div>
                                <div className="bg-white p-2 px-3 rounded-2xl border border-slate-200 flex-1">
                                    <p className="text-[10px] font-bold text-slate-400 mb-0.5">
                                        {comment.author ? `${comment.author.personalDetails.firstName} ${comment.author.personalDetails.lastName}` : 'Admin Team'}
                                    </p>
                                    <p className="text-xs text-slate-700 leading-tight">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center bg-white p-1 rounded-full border border-slate-200 pl-3 focus-within:ring-1 focus-within:ring-indigo-100 transition-all">
                        <input
                            type="text"
                            placeholder="Write a comment..."
                            className="flex-1 text-xs outline-none bg-transparent py-1"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={submittingComment || !commentText}
                            className="p-1 px-3 bg-indigo-600 text-white rounded-full text-[10px] font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all"
                        >
                            Post
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
