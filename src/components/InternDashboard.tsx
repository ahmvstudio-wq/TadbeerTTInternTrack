import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { DailyReport, Profile, ReportStatus } from '../types';
import { PlantGrower } from './PlantGrower';
import { exportToExcel } from '../utils/excelExport';
import { exportToPDF } from '../utils/pdfExport';
import { Calendar, Clock, Search, FileDown, Plus, BookOpen, MessageSquare, CheckCircle, CircleDashed } from 'lucide-react';
import type { InternTask } from '../types';

interface InternDashboardProps {
  user: Profile;
  onOpenReport: (report: DailyReport) => void;
}

export const InternDashboard: React.FC<InternDashboardProps> = ({ user, onOpenReport }) => {
  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [hoursWorked, setHoursWorked] = useState(8);
  const [objectives, setObjectives] = useState('');
  const [workCompleted, setWorkCompleted] = useState('');
  const [challenges, setChallenges] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [waitingFor, setWaitingFor] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [status, setStatus] = useState<ReportStatus>('completed');

  // List & Filter State
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<DailyReport[]>([]);
  const [tasks, setTasks] = useState<InternTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-calculate Hours Worked from Start & End times
  useEffect(() => {
    if (startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      
      let diffMs = (endH * 60 + endM) - (startH * 60 + startM);
      if (diffMs < 0) {
        // Handle overnight shift if end time is next day
        diffMs += 24 * 60;
      }
      
      const hrs = Number((diffMs / 60).toFixed(2));
      setHoursWorked(hrs);
    }
  }, [startTime, endTime]);

  // Fetch Reports
  const fetchReports = async () => {
    try {
      const [data, taskData] = await Promise.all([
        dbService.getReports({ internId: user.id }),
        dbService.getInternTasks(user.id)
      ]);
      setReports(data);
      setFilteredReports(data);
      setTasks(taskData);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user.id]);

  // Apply filters locally
  useEffect(() => {
    let result = [...reports];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        r =>
          r.date.includes(q) ||
          r.objectives.toLowerCase().includes(q) ||
          r.work_completed.toLowerCase().includes(q) ||
          r.tomorrow_plan.toLowerCase().includes(q) ||
          (r.challenges && r.challenges.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

    if (dateFilter) {
      result = result.filter(r => r.date === dateFilter);
    }

    setFilteredReports(result);
  }, [searchQuery, statusFilter, dateFilter, reports]);

  // Form Progress for Plant Grower
  const calculateProgress = () => {
    let score = 0;
    if (date) score += 10;
    if (startTime && endTime) score += 10;
    if (objectives.trim().length > 10) score += 20;
    if (workCompleted.trim().length > 15) score += 20;
    if (tomorrowPlan.trim().length > 10) score += 10;
    
    // Optional fields adding up to 30%
    if (challenges.trim().length > 5) score += 10;
    if (suggestions.trim().length > 5) score += 10;
    if (waitingFor.trim().length > 5) score += 10;
    
    return Math.min(100, score);
  };

  const progressPercentage = calculateProgress();

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMsg(null);

    // Validations
    const todayStr = new Date().toISOString().split('T')[0];
    if (date > todayStr) {
      setFeedbackMsg({ type: 'error', text: 'You cannot submit a report for a future date.' });
      setIsSubmitting(false);
      return;
    }

    if (hoursWorked <= 0) {
      setFeedbackMsg({ type: 'error', text: 'End Time must be after Start Time.' });
      setIsSubmitting(false);
      return;
    }

    if (hoursWorked > 24) {
      setFeedbackMsg({ type: 'error', text: 'Hours worked cannot exceed 24 hours in a single day.' });
      setIsSubmitting(false);
      return;
    }

    // Double Submission Check
    const isDuplicate = reports.some(r => r.date === date);
    if (isDuplicate) {
      setFeedbackMsg({ type: 'error', text: `A journal entry has already been submitted for the date: ${date}. Please select another date.` });
      setIsSubmitting(false);
      return;
    }

    if (objectives.trim().length < 15) {
      setFeedbackMsg({ type: 'error', text: "Today's Objectives must be descriptive (at least 15 characters)." });
      setIsSubmitting(false);
      return;
    }

    if (workCompleted.trim().length < 25) {
      setFeedbackMsg({ type: 'error', text: 'Work Completed description must be descriptive (at least 25 characters).' });
      setIsSubmitting(false);
      return;
    }

    if (tomorrowPlan.trim().length < 15) {
      setFeedbackMsg({ type: 'error', text: "Tomorrow's Plan must be descriptive (at least 15 characters)." });
      setIsSubmitting(false);
      return;
    }

    try {
      await dbService.submitReport({
        intern_id: user.id,
        date,
        start_time: startTime,
        end_time: endTime,
        hours_worked: hoursWorked,
        objectives: objectives.trim(),
        work_completed: workCompleted.trim(),
        challenges: challenges.trim(),
        suggestions: suggestions.trim(),
        waiting_for: waitingFor.trim(),
        tomorrow_plan: tomorrowPlan.trim(),
        status,
      });

      setFeedbackMsg({ type: 'success', text: 'Daily report submitted successfully!' });
      
      // Reset Form (except date/times)
      setObjectives('');
      setWorkCompleted('');
      setChallenges('');
      setSuggestions('');
      setWaitingFor('');
      setTomorrowPlan('');
      setStatus('completed');
      
      // Refresh list
      fetchReports();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Submission failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTask = async (task: InternTask) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await dbService.updateTaskStatus(task.id, newStatus);
      fetchReports(); // re-fetch tasks
    } catch (err) {
      console.error('Failed to toggle task', err);
    }
  };

  // Weekly Stats Summary for this Intern
  const weeklySummary = dbService.calculateWeeklySummary(reports);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      
      {/* Page Title & Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between text-left gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#0D4855]">
            Daily Work Journal
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Welcome back, {user.name}. Settle in and record your daily transformation metrics.
          </p>
        </div>
      </div>

      {/* Grid: Form (2 cols) & Plant + Stats (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Submission Form Panel */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-200/50 p-6 md:p-8 text-left transition-all">
          <div className="flex items-center gap-2 mb-6">
            <Plus className="w-5 h-5 text-[#C5A85C]" />
            <h3 className="text-lg font-bold text-[#0D4855]">
              Log Today's Work
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {feedbackMsg && (
              <div
                className={`p-4 rounded-xl text-xs font-semibold border ${
                  feedbackMsg.type === 'success'
                    ? 'bg-green-50 text-green-700 border-green-200/40'
                    : 'bg-red-50 text-red-700 border-red-200/40'
                }`}
              >
                {feedbackMsg.text}
              </div>
            )}

            {/* Date & Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0D4855]">Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0D4855]">Start Time *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0D4855]">End Time *</label>
                <div className="relative">
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-gray-400 font-bold">
                    ({hoursWorked} hrs)
                  </span>
                </div>
              </div>
            </div>

            {/* Objectives */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0D4855]">Today's Objectives *</label>
              <textarea
                rows={2}
                placeholder="What did you plan to achieve today?"
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] placeholder-gray-400"
                required
              />
            </div>

            {/* Work Completed */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0D4855]">Work Completed *</label>
              <textarea
                rows={3}
                placeholder="Describe your accomplishments in detail..."
                value={workCompleted}
                onChange={(e) => setWorkCompleted(e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] placeholder-gray-400"
                required
              />
            </div>

            {/* Optional Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0D4855]">Challenges / Blockers (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Any hurdles encountered?"
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] placeholder-gray-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0D4855]">Suggestions / Ideas (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="How can we optimize this workflow?"
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] placeholder-gray-400"
                />
              </div>
            </div>

            {/* Waiting For & Tomorrow's Plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0D4855]">Waiting For (Optional)</label>
                <input
                  type="text"
                  placeholder="Pending reviews or assets from teammate/admin?"
                  value={waitingFor}
                  onChange={(e) => setWaitingFor(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] placeholder-gray-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0D4855]">Tomorrow's Plan *</label>
                <input
                  type="text"
                  placeholder="What are your objectives for tomorrow?"
                  value={tomorrowPlan}
                  onChange={(e) => setTomorrowPlan(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] placeholder-gray-400"
                  required
                />
              </div>
            </div>

            {/* Status Selectors */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0D4855]">Overall Status *</label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('completed')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    status === 'completed'
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span>🟢</span>
                  <span>Completed</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('in_progress')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    status === 'in_progress'
                      ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span>🟡</span>
                  <span>In Progress</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('blocked')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    status === 'blocked'
                      ? 'bg-red-50 border-red-300 text-red-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span>🔴</span>
                  <span>Blocked</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#0D4855] text-white hover:bg-[#0A3D49] font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.99] tracking-wider uppercase disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting Report...' : 'Submit Daily Report'}
            </button>
          </form>
        </div>

        {/* Sidebar: Plant Grower & Weekly Summary */}
        <div className="space-y-8 flex flex-col">
          {/* Plant Grower Container */}
          <PlantGrower completionPercentage={progressPercentage} />

          {/* Weekly Summary Widget */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50 p-6 text-left flex-1 flex flex-col">
            <h3 className="text-md font-bold text-[#0D4855] mb-4">
              My Weekly Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-gray-150 flex flex-col justify-center">
                <span className="text-xl font-bold text-[#0D4855]">
                  {weeklySummary.totalHours.toFixed(1)}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400 mt-1">
                  Total Hours
                </span>
              </div>
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-gray-150 flex flex-col justify-center">
                <span className="text-xl font-bold text-[#0D4855]">
                  {weeklySummary.reportsSubmitted}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400 mt-1">
                  Submitted Logs
                </span>
              </div>
              <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100/50 flex flex-col justify-center">
                <span className="text-xl font-bold text-green-700">
                  {weeklySummary.completedDays}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-green-500/70 mt-1">
                  Completed Days
                </span>
              </div>
              <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50 flex flex-col justify-center">
                <span className="text-xl font-bold text-red-700">
                  {weeklySummary.blockedDays}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-red-500/70 mt-1">
                  Blocked Days
                </span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-4 leading-normal">
              Summaries are computed automatically from your complete chronological submission logs.
            </p>
          </div>

          {/* Assigned Tasks Widget */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50 p-6 text-left flex-1 flex flex-col max-h-[300px]">
            <h3 className="text-md font-bold text-[#0D4855] mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
              <CheckCircle className="w-4 h-4 text-[#C5A85C]" />
              My Assigned Tasks
            </h3>
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {tasks.length === 0 ? (
                <p className="text-xs text-gray-400 font-medium py-4 text-center">No pending tasks.</p>
              ) : (
                tasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                      task.status === 'completed' 
                        ? 'bg-gray-50 border-gray-200/50' 
                        : 'bg-white border-gray-200 shadow-sm'
                    }`}
                  >
                    <button 
                      onClick={() => handleToggleTask(task)}
                      className="mt-0.5 text-[#C5A85C] hover:text-[#0D4855] transition-colors"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <CircleDashed className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <h4 className={`text-xs font-bold ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-[#0D4855]'}`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className={`text-[10px] mt-1 leading-relaxed ${task.status === 'completed' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Panel: Submission History */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50 p-6 md:p-8 text-left transition-all">
        
        {/* Header with Search and Export */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#C5A85C]" />
            <div>
              <h3 className="text-lg font-bold text-[#0D4855]">
                Submission History
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Your submitted reports in reverse chronological order</p>
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] w-44"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
            >
              <option value="all">All Statuses</option>
              <option value="completed">🟢 Completed</option>
              <option value="in_progress">🟡 In Progress</option>
              <option value="blocked">🔴 Blocked</option>
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
            />

            {/* Export Trigger Buttons */}
            <button
              onClick={() => exportToExcel(filteredReports)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl text-gray-600 shadow-sm transition-all"
            >
              <FileDown className="w-3.5 h-3.5 text-green-600" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => exportToPDF(filteredReports, `${user.name} - Daily Work Reports`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl text-gray-600 shadow-sm transition-all"
            >
              <FileDown className="w-3.5 h-3.5 text-red-500" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* History List Grid */}
        {filteredReports.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm text-gray-400 font-semibold">No journal entries found matching filters.</p>
            <p className="text-xs text-gray-400 mt-1">Try resetting the date or search parameters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => onOpenReport(report)}
                className="bg-white rounded-2xl border border-gray-200/50 p-5 shadow-sm hover:shadow-md hover:border-[#C5A85C]/30 hover:scale-[1.01] transition-all duration-200 cursor-pointer text-left flex flex-col relative group overflow-hidden"
              >
                {/* Visual Accent Pill */}
                <div
                  className={`absolute top-0 left-0 w-full h-1 ${
                    report.status === 'completed'
                      ? 'bg-green-500'
                      : report.status === 'in_progress'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                />

                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0D4855]">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A85C]" />
                    <span>{report.date}</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {report.hours_worked} hrs
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  <div>
                    <h5 className="text-[9px] uppercase tracking-wider text-[#C5A85C] font-bold">Objectives</h5>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-0.5 font-medium leading-relaxed">
                      {report.objectives}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-[9px] uppercase tracking-wider text-[#C5A85C] font-bold">Work Completed</h5>
                    <p className="text-xs text-gray-600 line-clamp-3 mt-0.5 font-medium leading-relaxed">
                      {report.work_completed}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-400">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] ${
                    report.status === 'completed'
                      ? 'bg-green-50 text-green-700'
                      : report.status === 'in_progress'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {report.status.toUpperCase()}
                  </span>
                  
                  {/* Comments Count indicator */}
                  {report.comments && report.comments.length > 0 && (
                    <span className="flex items-center gap-1 text-[#0D4855]">
                      <MessageSquare className="w-3.5 h-3.5 text-[#C5A85C]" />
                      <span>{report.comments.length} review{report.comments.length > 1 ? 's' : ''}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
