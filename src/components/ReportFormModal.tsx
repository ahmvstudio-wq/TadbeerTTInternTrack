import React, { useState } from 'react';
import { dbService } from '../services/db';
import { X, Plus } from 'lucide-react';

interface ReportFormModalProps {
  internId: string;
  internName: string;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export const ReportFormModal: React.FC<ReportFormModalProps> = ({ internId, internName, onClose, onSubmitSuccess }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [objectives, setObjectives] = useState('');
  const [workCompleted, setWorkCompleted] = useState('');
  const [challenges, setChallenges] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [waitingFor, setWaitingFor] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [status, setStatus] = useState<'completed' | 'in_progress' | 'blocked'>('completed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateHours = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let total = endH + endM / 60 - (startH + startM / 60);
    return total > 0 ? Number(total.toFixed(2)) : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await dbService.createReport({
        intern_id: internId,
        intern_name: internName,
        date,
        start_time: startTime,
        end_time: endTime,
        hours_worked: calculateHours(startTime, endTime),
        objectives,
        work_completed: workCompleted,
        challenges,
        suggestions,
        waiting_for: waitingFor,
        tomorrow_plan: tomorrowPlan,
        status,
      });
      onSubmitSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#0A2127]/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative bg-[#FAF8F5] w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200/50 flex flex-col max-h-[95vh] z-10 text-left">
        
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-gray-200/50 flex items-center justify-between rounded-t-3xl shrink-0">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#C5A85C]" />
            <h3 className="text-lg font-bold text-[#0D4855]">
              Log Today's Work
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <form id="report-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold border border-red-200/40">
                {error}
              </div>
            )}

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#0D4855] uppercase tracking-wider">Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] font-semibold"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#0D4855] uppercase tracking-wider">Start *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] font-semibold"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#0D4855] uppercase tracking-wider">End *</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] font-semibold"
                  required
                />
              </div>
            </div>

            {/* Objectives */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#0D4855] uppercase tracking-wider">Today's Objectives *</label>
              <textarea
                rows={2}
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] font-semibold"
                required
              />
            </div>

            {/* Work Completed */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#0D4855] uppercase tracking-wider">Work Completed *</label>
              <textarea
                rows={3}
                value={workCompleted}
                onChange={(e) => setWorkCompleted(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] font-semibold"
                required
              />
            </div>

            {/* Optional Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#0D4855] uppercase tracking-wider">Challenges</label>
                <textarea
                  rows={2}
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#0D4855] uppercase tracking-wider">Suggestions</label>
                <textarea
                  rows={2}
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] font-semibold"
                />
              </div>
            </div>

            {/* Waiting For & Tomorrow's Plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#0D4855] uppercase tracking-wider">Waiting For</label>
                <input
                  type="text"
                  value={waitingFor}
                  onChange={(e) => setWaitingFor(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#0D4855] uppercase tracking-wider">Tomorrow's Plan *</label>
                <input
                  type="text"
                  value={tomorrowPlan}
                  onChange={(e) => setTomorrowPlan(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] font-semibold"
                  required
                />
              </div>
            </div>

            {/* Status Selectors */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#0D4855] uppercase tracking-wider">Status *</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('completed')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                    status === 'completed' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  🟢 Completed
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('in_progress')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                    status === 'in_progress' ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  🟡 In Progress
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('blocked')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                    status === 'blocked' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  🔴 Blocked
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white border-t border-gray-200/50 rounded-b-3xl shrink-0 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 font-bold text-xs rounded-xl shadow-sm hover:bg-gray-50 transition-all"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="report-form"
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#0D4855] text-white hover:bg-[#0A3D49] font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
};
