"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/context/SessionContext";
import {
  Heart,
  MessageCircle,
  Send,
  User,
  Megaphone,
  Plus,
  Loader2,
  Clock,
  Sparkles,
  Share2,
  X,
  Info,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function SocialFeed() {
  const { user } = useSession();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState({ content: "", type: "post" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/engagement/shout-outs");
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts || []);
      }
    } catch (error) {
      toast.error("Failed to load community feed");
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.content.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/v1/admin/engagement/shout-outs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newPost.content,
          type: "post"
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Message shared to everyone! 🎉");
        setNewPost({ content: "", type: "post" });
        fetchFeed();
      } else {
        toast.error(data.message || "Failed to publish post");
      }
    } catch (error) {
      toast.error("An error occurred while publishing.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (postId) => {
    try {
      const res = await fetch(`/api/v1/admin/engagement/shout-outs/${postId}/like`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p._id === postId
              ? {
                  ...p,
                  likes: p.likes.includes(user.id)
                    ? p.likes.filter(id => id !== user.id)
                    : [...p.likes, user.id]
                }
              : p
          )
        );
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex h-[75vh] flex-col items-center justify-center gap-4">
        <div className="relative flex items-center justify-center w-12 h-12">
          <div className="absolute w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <Megaphone className="w-5 h-5 text-indigo-600 animate-pulse" />
        </div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Loading social database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter',sans-serif] pb-16">
      <Toaster position="top-right" richColors closeButton />
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                {/* Standard Hero */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4 mt-2">
              <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      Social Feed
                  </h1>
                  <p className="text-slate-500 text-sm mt-1 max-w-xl">
                      Stay connected with company updates, announcements, and team celebrations.
                  </p>
              </div>
              <div className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Universal Channel
              </div>
          </div>

        {/* Message Creator Box */}
        <form onSubmit={handlePostSubmit} className="bg-white rounded-[2rem] border border-slate-200/60 p-6 space-y-4 transition-all focus-within:">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0">
              {user?.personalDetails?.firstName?.[0] || <User className="w-5 h-5" />}
            </div>
            
            <div className="flex-1">
              <textarea
                placeholder="What is happening today? Share a message with all colleagues..."
                className="w-full text-sm text-slate-800 placeholder-slate-400 outline-none resize-none min-h-[90px] py-1 leading-relaxed bg-transparent"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex gap-2 items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <Info className="w-4 h-4 text-indigo-500" />
              <span>Visible to all organization members</span>
            </div>

            <button
              type="submit"
              disabled={submitting || !newPost.content.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 shrink-0"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {submitting ? "Sharing..." : "Share to All"}
            </button>
          </div>
        </form>

        {/* Dynamic Feed Posts */}
        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map(post => (
              <PostCard key={post._id} post={post} user={user} onLike={() => toggleLike(post._id)} />
            ))
          ) : (
            <div className="bg-white rounded-3xl p-16 border border-dashed border-slate-200/80 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Share2 className="w-8 h-8 text-slate-300 animate-pulse" />
              </div>
              <h4 className="text-base font-black text-slate-900">Quiet on the board</h4>
              <p className="text-slate-400 text-xs mt-1 max-w-xs">Be the first to share an update or announcement with the team!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function PostCard({ post, user, onLike }) {
  const isLiked = post.likes.includes(user.id);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [localComments, setLocalComments] = useState(post.comments || []);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await fetch(`/api/v1/admin/engagement/shout-outs/${post._id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Comment published!");
        // Optimistically update local comments log for live responsiveness
        const newLocalComment = {
          text: commentText.trim(),
          author: {
            personalDetails: {
              firstName: user.firstName || user.name?.split(" ")?.[0] || "Me",
              lastName: user.lastName || ""
            }
          },
          createdAt: new Date().toISOString()
        };
        setLocalComments(prev => [...prev, newLocalComment]);
        setCommentText("");
      }
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const getAuthorInitials = (author) => {
    if (!author?.personalDetails) return "U";
    const first = author.personalDetails.firstName?.[0] || "";
    const last = author.personalDetails.lastName?.[0] || "";
    return `${first}${last}`.toUpperCase() || "U";
  };

  const getCommentAuthorInitials = (commentAuthor) => {
    if (!commentAuthor?.personalDetails) return "C";
    const first = commentAuthor.personalDetails.firstName?.[0] || "";
    const last = commentAuthor.personalDetails.lastName?.[0] || "";
    return `${first}${last}`.toUpperCase() || "C";
  };

  const formatPostDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden flex flex-col hover:border-slate-300 transition-all duration-300">
      
      {/* Post Main Body */}
      <div className="p-6 space-y-4">
        
        {/* Post Author info */}
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-slate-700 font-bold text-xs">
              {getAuthorInitials(post.author)}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-slate-900 leading-none">
                  {post.author ? `${post.author.personalDetails.firstName} ${post.author.personalDetails.lastName}` : 'Admin Team'}
                </p>
                {post.announcementByAdmin && (
                  <span className="text-[8px] bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase font-black tracking-wider align-middle leading-none">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-300" />
                {formatPostDate(post.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Content text */}
        <div className="space-y-3 pt-1">
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
            {post.content}
          </p>
        </div>
      </div>

      {/* Interactive Toolbar */}
      <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center gap-6">
        <button
          onClick={onLike}
          className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition-all select-none ${
            isLiked ? 'text-rose-500 scale-105 animate-pulse' : 'text-slate-500 hover:text-rose-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          {post.likes.length > 0 && <span className="font-bold text-xs">{post.likes.length}</span>}
          {isLiked ? 'Liked' : 'Like'}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition-colors ${
            showComments ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          {localComments.length > 0 && <span className="font-bold text-xs">{localComments.length}</span>}
          Comments
        </button>
      </div>

      {/* Expanded Comments List */}
      {showComments && (
        <div className="px-6 pb-6 bg-slate-50/40 border-t border-slate-100/50 space-y-4 animate-in slide-in-from-top-2 duration-300">
          
          {/* Scrollable comments logger */}
          {localComments.length > 0 && (
            <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-2 pt-4">
              {localComments.map((comment, idx) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 bg-slate-100 border border-slate-200/50 rounded-lg flex items-center justify-center text-slate-600 font-bold text-[10px] shrink-0">
                    {getCommentAuthorInitials(comment.author)}
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-black text-slate-800">
                        {comment.author ? `${comment.author.personalDetails.firstName} ${comment.author.personalDetails.lastName}` : 'Admin Team'}
                      </p>
                      {comment.createdAt && (
                        <span className="text-[8px] text-slate-400 font-bold">
                          {new Date(comment.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 leading-normal font-medium">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Comment Submission form */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center bg-white p-1 rounded-full border border-slate-200/60 pl-4 focus-within:border-slate-300 transition-all mt-4">
            <input
              type="text"
              placeholder="Add a reply to this post..."
              className="flex-1 text-xs outline-none bg-transparent py-2 text-slate-800 placeholder-slate-400"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="p-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest disabled:opacity-50 transition-all flex items-center gap-1 active:scale-95 shrink-0"
            >
              {submittingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Reply
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
