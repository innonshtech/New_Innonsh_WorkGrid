import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';

export default function PayrollQueryDesk({
  queries = [],
  selectedQuery,
  setSelectedQuery,
  newComment,
  setNewComment,
  postCommentReply,
  resolveQuery,
  replyLoading
}) {
  const [queryFilter, setQueryFilter] = useState('ALL');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Left Panel: Query List */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-12rem)] shadow-sm">
        <div className="p-5 border-b border-slate-100 space-y-3 bg-slate-50/50">
          <h3 className="font-extrabold text-sm flex items-center space-x-2 text-slate-900">
            <MessageSquare className="h-4.5 w-4.5 text-indigo-600" />
            <span>Dispute & Query Desk</span>
          </h3>
          <div className="flex items-center space-x-2">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(filter => (
              <button
                key={filter}
                onClick={() => setQueryFilter(filter)}
                className={`px-2.5 py-1 text-[10px] rounded-lg font-bold border transition-all ${
                  queryFilter === filter
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:text-indigo-600'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-2 bg-slate-50/20">
          {queries
            .filter(q => queryFilter === 'ALL' || q.status === queryFilter)
            .map(q => (
              <div
                key={q.id}
                onClick={() => setSelectedQuery(q)}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${
                  selectedQuery?.id === q.id
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                    : 'bg-white border-slate-200/60 hover:border-slate-350'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-xs text-slate-800">{q.subject}</h4>
                  <span className={`px-2 py-0.5 text-[9px] rounded-full font-bold border ${
                    q.status === 'OPEN' 
                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                      : q.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {q.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{q.description}</p>
                <div className="flex items-center justify-between text-[9px] text-slate-400 mt-2">
                  <span>{q.employeeName} ({q.employeeCode})</span>
                  <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          {queries.length === 0 && (
            <p className="text-xs text-slate-500 py-8 text-center">No ticket threads found.</p>
          )}
        </div>
      </div>

      {/* Right Panel: Chat/Details */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl flex flex-col h-[calc(100vh-12rem)] overflow-hidden shadow-sm">
        {selectedQuery ? (
          <>
            {/* Header info */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">ticket details</span>
                <h3 className="font-extrabold text-base text-slate-900 mt-0.5">{selectedQuery.subject}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Raised by: {selectedQuery.employeeName} • Priority: {selectedQuery.priority}</p>
              </div>

              <div className="flex items-center space-x-2">
                {selectedQuery.status !== 'RESOLVED' ? (
                  <button
                    onClick={() => resolveQuery('RESOLVED')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                  >
                    Mark Resolved
                  </button>
                ) : (
                  <button
                    onClick={() => resolveQuery('OPEN')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all"
                  >
                    Re-Open Ticket
                  </button>
                )}
              </div>
            </div>

            {/* Chat Messages flow */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/10">
              {selectedQuery.comments?.map(comment => {
                const isAdmin = comment.commentByRole === 'ADMIN' || comment.commentByRole === 'HR' || comment.commentByRole === 'FINANCE';
                return (
                  <div 
                    key={comment.id}
                    className={`flex flex-col max-w-[80%] rounded-2xl p-4 shadow-sm border ${
                      isAdmin 
                        ? 'bg-indigo-50 border-indigo-100 self-end ml-auto' 
                        : 'bg-white border-slate-200 self-start mr-auto'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wide border-b border-slate-100 pb-1 mb-2">
                      <span>{comment.commentByName} ({comment.commentByRole})</span>
                      <span>{new Date(comment.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-normal">{comment.message}</p>
                  </div>
                );
              })}
              {selectedQuery.comments?.length === 0 && (
                <p className="text-xs text-slate-500 py-6 text-center">No replies in this query thread yet.</p>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={postCommentReply} className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center space-x-3">
              <input
                type="text"
                placeholder="Type query reply message..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/15"
              />
              <button
                type="submit"
                disabled={replyLoading || !newComment.trim()}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-sm flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="m-auto text-center space-y-2">
            <MessageSquare className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No Thread Selected</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">Select an employee query thread from the side panel to view messages and post replies.</p>
          </div>
        )}
      </div>

    </div>
  );
}
