import React, { useState } from 'react';
import { X, Calendar, Clock, AlertTriangle, AlertCircle, CheckCircle, MessageSquare, Send } from 'lucide-react';
import type { DailyReport, Profile } from '../types';

interface ReportDetailsModalProps {
  report: DailyReport;
  currentUser: Profile;
  onClose: () => void;
  onAddComment: (reportId: string, commentText: string) => Promise<void>;
}

export const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({
  report,
  currentUser,
  onClose,
  onAddComment,
}) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onAddComment(report.id, commentText.trim());
      setCommentText('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200/50">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200/50">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>In Progress</span>
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-200/50">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Blocked</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 md:p-6">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#0A2127]/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative bg-[#FAF8F5] w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 transform scale-100 z-10">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-white border-b border-gray-200/50 flex items-center justify-between">
          <div className="flex flex-col text-left">
            <h3 className="text-xl font-bold text-[#0D4855]">
              {report.intern_name || 'Daily Work Journal'}
            </h3>
            <span className="text-[10px] text-[#C5A85C] uppercase tracking-wider font-semibold mt-0.5">
              Journal Entry Details
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4.5 rounded-2xl border border-gray-200/40 shadow-sm">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#C5A85C]" />
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Reporting Date</span>
                <span className="text-sm font-semibold text-[#0D4855]">{report.date}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#C5A85C]" />
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Work Log</span>
                <span className="text-sm font-semibold text-[#0D4855]">
                  {report.start_time} - {report.end_time} ({report.hours_worked} hrs)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1">Status</span>
                <div>{getStatusBadge(report.status)}</div>
              </div>
            </div>
          </div>

          {/* Form Fields Displays */}
          <div className="space-y-5">
            {/* Objectives */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/40 shadow-sm">
              <h4 className="text-xs uppercase tracking-wider text-[#C5A85C] font-bold mb-2">Today's Objectives</h4>
              <p className="text-sm text-[#0D4855] leading-relaxed font-medium whitespace-pre-wrap">{report.objectives}</p>
            </div>

            {/* Work Completed */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/40 shadow-sm">
              <h4 className="text-xs uppercase tracking-wider text-[#C5A85C] font-bold mb-2">Work Completed</h4>
              <p className="text-sm text-[#0D4855] leading-relaxed font-medium whitespace-pre-wrap">{report.work_completed}</p>
            </div>

            {/* Conditionally Render Optional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Challenges */}
              {report.challenges && (
                <div className="bg-white p-5 rounded-2xl border border-red-200/30 shadow-sm">
                  <h4 className="text-xs uppercase tracking-wider text-red-500 font-bold mb-2">Challenges / Blockers</h4>
                  <p className="text-sm text-red-800 leading-relaxed font-medium whitespace-pre-wrap">{report.challenges}</p>
                </div>
              )}

              {/* Suggestions */}
              {report.suggestions && (
                <div className="bg-white p-5 rounded-2xl border border-gray-200/40 shadow-sm">
                  <h4 className="text-xs uppercase tracking-wider text-[#C5A85C] font-bold mb-2">Suggestions / Ideas</h4>
                  <p className="text-sm text-[#0D4855] leading-relaxed font-medium whitespace-pre-wrap">{report.suggestions}</p>
                </div>
              )}

              {/* Waiting For */}
              {report.waiting_for && (
                <div className="bg-white p-5 rounded-2xl border border-yellow-200/30 shadow-sm">
                  <h4 className="text-xs uppercase tracking-wider text-yellow-600 font-bold mb-2">Waiting For</h4>
                  <p className="text-sm text-yellow-850 leading-relaxed font-medium whitespace-pre-wrap">{report.waiting_for}</p>
                </div>
              )}

              {/* Tomorrow's Plan */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200/40 shadow-sm">
                <h4 className="text-xs uppercase tracking-wider text-[#C5A85C] font-bold mb-2">Tomorrow's Plan</h4>
                <p className="text-sm text-[#0D4855] leading-relaxed font-medium whitespace-pre-wrap">{report.tomorrow_plan}</p>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="pt-4 border-t border-gray-200/50">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-[#C5A85C]" />
              <h4 className="text-sm font-bold text-[#0D4855]">Admin Comments</h4>
            </div>

            {/* Comment Thread List */}
            {(!report.comments || report.comments.length === 0) ? (
              <div className="text-center py-6 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400 font-medium">No comments posted yet.</p>
              </div>
            ) : (
              <div className="space-y-3.5 mb-5">
                {report.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-2xl border ${
                      comment.author_role === 'admin'
                        ? 'bg-[#F4F8F9] border-[#C5A85C]/15 text-left'
                        : 'bg-white border-gray-200/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0D4855]">
                          {comment.author_name}
                        </span>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#C5A85C]/10 text-[#C5A85C] uppercase tracking-wide">
                          {comment.author_role}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {new Date(comment.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium whitespace-pre-line">
                      {comment.comment_text}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Admin Add Comment Form */}
            {currentUser.role === 'admin' && (
              <form onSubmit={handleSubmitComment} className="flex gap-2 mt-4 items-stretch">
                <input
                  type="text"
                  placeholder="Leave professional review notes..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A85C] focus:border-[#C5A85C] text-[#0D4855] placeholder-gray-400"
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !commentText.trim()}
                  className="px-4 bg-[#0D4855] text-white hover:bg-[#0A3D49] font-bold rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
            
            {error && (
              <p className="text-xs text-red-500 mt-2 font-medium">{error}</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
