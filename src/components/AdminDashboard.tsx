import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { DailyReport, Profile, Invitation } from '../types';
import { exportToExcel } from '../utils/excelExport';
import { exportToPDF } from '../utils/pdfExport';
import { Users, FileText, AlertCircle, Clock, Search, Filter, Calendar, FileDown, Eye, CheckCircle2, Link2, Copy, Check, Trash2, Mail, LayoutDashboard, TrendingUp, BookOpen, MessageSquare, Send, HelpCircle, Sparkles } from 'lucide-react';
import { InternPerformanceView } from './InternPerformanceView';

interface DayBookCardProps {
  report: DailyReport;
  adminUser: Profile;
  onRefresh: () => void;
  onOpenReport: (report: DailyReport) => void;
}

const DayBookCard: React.FC<DayBookCardProps> = ({ report, adminUser, onRefresh, onOpenReport }) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await dbService.addComment(report.id, adminUser.id, commentText.trim());
      setCommentText('');
      onRefresh();
    } catch (err) {
      console.error('Failed to post inline comment:', err);
      alert('Failed to post comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border border-green-200/30';
      case 'in_progress': return 'bg-yellow-50 text-yellow-700 border border-yellow-200/30';
      case 'blocked': return 'bg-red-50 text-red-700 border border-red-200/30';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/50 shadow-sm p-6 text-left hover:shadow-md transition-all flex flex-col md:flex-row gap-6">
      
      {/* Left side info (Intern metadata & Date) */}
      <div className="w-full md:w-1/4 flex flex-row md:flex-col justify-between md:justify-start items-start gap-4 pb-4 md:pb-0 border-b md:border-b-0 md:border-r border-gray-100 pr-0 md:pr-6">
        <div className="space-y-1.5">
          <h4 className="text-md font-bold text-[#0D4855] leading-tight">
            {report.intern_name || 'N/A'}
          </h4>
          <span className="text-[10px] text-gray-500 font-semibold block uppercase tracking-wider">
            {report.date}
          </span>
        </div>
        <div className="flex flex-col md:items-start items-end gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(report.status)}`}>
            {report.status.toUpperCase().replace('_', ' ')}
          </span>
          <span className="text-xs font-bold text-gray-500">
            {report.hours_worked} hrs worked
          </span>
        </div>
      </div>

      {/* Middle side (Journal text sections) */}
      <div className="w-full md:w-2/4 space-y-4">
        {/* Work Completed */}
        <div className="space-y-1">
          <h5 className="text-[10px] uppercase font-bold text-[#C5A85C] tracking-wider">Work Completed</h5>
          <p className="text-xs text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{report.work_completed}</p>
        </div>

        {/* Objectives */}
        <div className="space-y-1">
          <h5 className="text-[10px] uppercase font-bold text-[#C5A85C] tracking-wider">Objectives</h5>
          <p className="text-xs text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">{report.objectives}</p>
        </div>

        {/* Challenges */}
        {report.challenges && (
          <div className="bg-red-50/50 p-3 rounded-2xl border border-red-105 flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-[10px] uppercase font-bold text-red-700 tracking-wider">Challenges Faced</h5>
              <p className="text-xs text-red-650 leading-relaxed font-medium whitespace-pre-wrap">{report.challenges}</p>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={() => onOpenReport(report)}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0D4855] hover:text-[#C5A85C] transition-all bg-[#FAF8F5] hover:bg-gray-150 px-3.5 py-2 rounded-xl border border-gray-200"
          >
            <Eye className="w-3 h-3 text-[#C5A85C]" />
            <span>Open Detailed Journal</span>
          </button>
        </div>
      </div>

      {/* Right side (Review/Discussion column) */}
      <div className="w-full md:w-1/4 bg-[#FAF8F5] p-4.5 rounded-2xl border border-gray-150 flex flex-col justify-between">
        <div>
          <h5 className="text-[10px] uppercase font-bold text-[#0D4855] tracking-wider mb-3 pb-2 border-b border-gray-200 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-[#C5A85C]" />
            Review Comments ({report.comments?.length || 0})
          </h5>
          
          <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar text-[11px] mb-3">
            {!report.comments || report.comments.length === 0 ? (
              <p className="text-gray-400 italic text-center py-4">No comments posted yet.</p>
            ) : (
              report.comments.map((comment) => (
                <div key={comment.id} className="bg-white p-2 rounded-lg border border-gray-150 relative text-left">
                  <p className="font-extrabold text-[#0D4855] text-[9px] mb-0.5 flex justify-between">
                    <span>{comment.author_name}</span>
                    <span className="text-[8px] font-medium text-gray-400">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </p>
                  <p className="text-gray-650 font-medium leading-normal whitespace-pre-wrap">{comment.comment_text}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inline comment form */}
        <form onSubmit={handlePostComment} className="flex gap-2 items-center mt-2 pt-2 border-t border-gray-200">
          <input
            type="text"
            placeholder="Add a review note..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={isSubmitting}
            className="flex-1 bg-white border border-gray-200 px-3 py-2 rounded-xl text-[11px] focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] font-medium"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting || !commentText.trim()}
            className="p-2 bg-[#0D4855] hover:bg-[#0A3D49] text-white rounded-xl shadow-sm transition-all flex items-center justify-center disabled:opacity-40"
            title="Post Comment"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>

    </div>
  );
};

interface AdminDashboardProps {
  onOpenReport: (report: DailyReport) => void;
  currentUser: Profile;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenReport, currentUser }) => {
  // Database States
  const [interns, setInterns] = useState<Profile[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<DailyReport[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  
  // Invite Form States
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Dashboard Stats State
  const [stats, setStats] = useState({
    totalInterns: 0,
    reportsToday: 0,
    pendingReports: 0,
    totalHours: 0,
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIntern, setSelectedIntern] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'daybook' | 'performance'>('overview');

  // Onboarding Guide State
  const [showGuide, setShowGuide] = useState<boolean>(() => {
    const saved = localStorage.getItem('tadbeer_admin_show_guide');
    return saved !== 'false';
  });

  const handleDismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem('tadbeer_admin_show_guide', 'false');
  };

  // Daybook Specific Filter State
  const [daybookQuery, setDaybookQuery] = useState('');
  const [daybookIntern, setDaybookIntern] = useState('all');

  // Daybook Reports filter logic
  const daybookReports = reports.filter(r => {
    const matchesQuery = !daybookQuery.trim() || 
      (r.intern_name && r.intern_name.toLowerCase().includes(daybookQuery.toLowerCase())) ||
      r.work_completed.toLowerCase().includes(daybookQuery.toLowerCase()) ||
      (r.challenges && r.challenges.toLowerCase().includes(daybookQuery.toLowerCase())) ||
      r.objectives.toLowerCase().includes(daybookQuery.toLowerCase());
      
    const matchesIntern = daybookIntern === 'all' || r.intern_id === daybookIntern;
    
    return matchesQuery && matchesIntern;
  });

  // Detect mobile width and default to performance tab for prioritized main visual
  useEffect(() => {
    if (window.innerWidth < 768) {
      setActiveTab('performance');
    }
  }, []);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const allInterns = await dbService.getInterns();
      const allReports = await dbService.getReports();
      const todayStats = await dbService.getAdminDashboardStats();
      const activeInvites = await dbService.getInvitations();
      
      setInterns(allInterns);
      setReports(allReports);
      setFilteredReports(allReports);
      setStats(todayStats);
      setInvitations(activeInvites);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync data refresh when reviews/comments occur
  useEffect(() => {
    const handleRefresh = () => {
      fetchData();
    };
    window.addEventListener('refresh-admin-dashboard', handleRefresh);
    return () => window.removeEventListener('refresh-admin-dashboard', handleRefresh);
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = [...reports];

    // Text search (Intern Name, Date, Keyword in content)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        r =>
          (r.intern_name && r.intern_name.toLowerCase().includes(q)) ||
          r.date.includes(q) ||
          r.objectives.toLowerCase().includes(q) ||
          r.work_completed.toLowerCase().includes(q) ||
          (r.challenges && r.challenges.toLowerCase().includes(q))
      );
    }

    // Intern Filter
    if (selectedIntern !== 'all') {
      result = result.filter(r => r.intern_id === selectedIntern);
    }

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

    // Date Range Filters
    if (startDate) {
      result = result.filter(r => r.date >= startDate);
    }
    if (endDate) {
      result = result.filter(r => r.date <= endDate);
    }

    setFilteredReports(result);
  }, [searchQuery, selectedIntern, statusFilter, startDate, endDate, reports]);

  // Invite Intern Submission
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    setGeneratedLink('');

    if (!inviteEmail.trim() || !inviteName.trim()) {
      setInviteError('Please fill out both name and email.');
      return;
    }

    try {
      const link = await dbService.inviteIntern(inviteEmail.trim().toLowerCase(), inviteName.trim());
      setGeneratedLink(link);
      setInviteSuccess(`Magic Link generated successfully for ${inviteName}!`);
      setInviteName('');
      setInviteEmail('');
      fetchData(); // reload invites list
    } catch (err: any) {
      setInviteError(err.message || 'Failed to create invitation link.');
    }
  };

  // Delete/Revoke Invitation
  const handleDeleteInvite = async (id: string) => {
    try {
      await dbService.deleteInvitation(id);
      fetchData();
    } catch (err) {
      console.error('Error deleting invitation:', err);
    }
  };

  // Copy Magic Link to clipboard
  const handleCopyLink = (linkToCopy: string) => {
    navigator.clipboard.writeText(linkToCopy);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200/30">
            <span className="w-1 h-1 rounded-full bg-green-500" />
            <span>Completed</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200/30">
            <span className="w-1 h-1 rounded-full bg-yellow-500" />
            <span>In Progress</span>
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200/30">
            <span className="w-1 h-1 rounded-full bg-red-500" />
            <span>Blocked</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 pb-24 md:pb-8">
      
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="text-left flex items-start gap-3">
          <div>
            <h2 className="text-3xl font-bold text-[#0D4855] flex items-center gap-2">
              <span>Admin Control Panel</span>
              <button 
                onClick={() => setShowGuide(!showGuide)} 
                className="p-1 hover:bg-gray-100 rounded-lg text-[#C5A85C] transition-all"
                title="Toggle Dashboard Guide"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Monitor intern progress, manage magic link invites, and review performance.
            </p>
          </div>
        </div>

        {/* Tab Navigation (Desktop Only) */}
        <div className="hidden md:flex items-center gap-2 bg-[#FAF8F5] p-1.5 rounded-2xl border border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-[#0D4855] shadow-sm'
                : 'text-gray-500 hover:text-[#0D4855]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Global Overview
          </button>
          <button
            onClick={() => setActiveTab('daybook')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'daybook'
                ? 'bg-white text-[#0D4855] shadow-sm'
                : 'text-gray-500 hover:text-[#0D4855]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Intern Day Book
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'performance'
                ? 'bg-white text-[#0D4855] shadow-sm'
                : 'text-gray-500 hover:text-[#0D4855]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Intern Performance Hub
          </button>
        </div>
      </div>

      {/* Admin Onboarding & Guide */}
      {showGuide && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#C5A85C]/35 shadow-sm relative overflow-hidden text-left transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#C5A85C]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C5A85C]" />
              <h3 className="text-md font-extrabold text-[#0D4855] uppercase tracking-wider">
                Admin Onboarding & Operations Guide
              </h3>
            </div>
            <button
              onClick={handleDismissGuide}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold px-3 py-1 bg-[#FAF8F5] border border-gray-200 rounded-lg hover:shadow-sm transition-all"
            >
              Got it, dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            <div className="space-y-2 bg-[#FAF8F5] p-4.5 rounded-2xl border border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-[#0D4855]/5 flex items-center justify-center font-bold text-xs text-[#0D4855]">
                1
              </div>
              <h4 className="text-xs font-extrabold text-[#0D4855]">Invite Interns</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                Enter an email and name on the <strong>Overview</strong> tab to generate a secure Magic Link. Share this link with them to register their profile.
              </p>
            </div>

            <div className="space-y-2 bg-[#FAF8F5] p-4.5 rounded-2xl border border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-[#0D4855]/5 flex items-center justify-center font-bold text-xs text-[#0D4855]">
                2
              </div>
              <h4 className="text-xs font-extrabold text-[#0D4855]">Read Journals</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                Open the new <strong>Intern Day Book</strong> to read full chronological journal posts. Filter by name or search keywords to track specific updates.
              </p>
            </div>

            <div className="space-y-2 bg-[#FAF8F5] p-4.5 rounded-2xl border border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-[#0D4855]/5 flex items-center justify-center font-bold text-xs text-[#0D4855]">
                3
              </div>
              <h4 className="text-xs font-extrabold text-[#0D4855]">Review Comments</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                Leave instant, inline comments on any day's log inside the Day Book feed. Giving immediate review notes keeps interns fully aligned.
              </p>
            </div>

            <div className="space-y-2 bg-[#FAF8F5] p-4.5 rounded-2xl border border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-[#0D4855]/5 flex items-center justify-center font-bold text-xs text-[#0D4855]">
                4
              </div>
              <h4 className="text-xs font-extrabold text-[#0D4855]">Track Performance</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                Switch to the <strong>Performance Hub</strong> to see 14-day hours trend charts, list completed tasks, and assign extra training tasks.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <>
          {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Interns */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-[#0D4855]/5 flex items-center justify-center text-[#0D4855]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-[#0D4855]">
              {stats.totalInterns}
            </span>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mt-1">
              Total Interns
            </p>
          </div>
        </div>

        {/* Reports Today */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-green-500/5 flex items-center justify-center text-green-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-[#0D4855]">
              {stats.reportsToday}
            </span>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mt-1">
              Reports Submitted Today
            </p>
          </div>
        </div>

        {/* Pending Reports */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/5 flex items-center justify-center text-yellow-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-[#0D4855]">
              {stats.pendingReports}
            </span>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mt-1">
              Pending Today Logs
            </p>
          </div>
        </div>

        {/* Total Hours */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-[#C5A85C]/5 flex items-center justify-center text-[#C5A85C]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-[#0D4855]">
              {stats.totalHours.toFixed(1)}
            </span>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mt-1">
              Total Hours Logged
            </p>
          </div>
        </div>

      </div>

      {/* Intern Invites & Magic Links Management Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Generate Invite Form */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-200/50 p-6 text-left shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-5 h-5 text-[#C5A85C]" />
            <h3 className="text-md font-bold text-[#0D4855]">
              Invite Intern (Magic Link)
            </h3>
          </div>
          
          <form onSubmit={handleInvite} className="space-y-4">
            {inviteError && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-semibold">
                {inviteError}
              </div>
            )}
            
            {inviteSuccess && (
              <div className="p-3 bg-green-50 text-green-700 border border-green-100 rounded-xl text-xs font-semibold">
                {inviteSuccess}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Intern Email *</label>
              <input
                type="email"
                placeholder="intern@tadbeer.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] font-semibold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Temporary Name *</label>
              <input
                type="text"
                placeholder="Aisha Al-Hashimi"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] font-semibold"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#0D4855] text-white hover:bg-[#0A3D49] font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              Generate Magic Link
            </button>
          </form>

          {/* Generated Magic Link Box */}
          {generatedLink && (
            <div className="mt-5 p-3.5 bg-[#FAF8F5] border border-[#C5A85C]/25 rounded-2xl space-y-2">
              <span className="text-[9px] uppercase tracking-wider font-bold text-[#C5A85C]">
                Copy Secure Magic Link
              </span>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-[10px] font-mono text-gray-600 focus:outline-none select-all"
                />
                <button
                  onClick={() => handleCopyLink(generatedLink)}
                  className="p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-500 hover:text-[#0D4855] transition-all"
                  title="Copy link to clipboard"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[9px] text-gray-400 leading-normal mt-1">
                Send this link to the intern. They will set up their profile directly upon opening this URL.
              </p>
            </div>
          )}
        </div>

        {/* Active / Pending Invitations List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/50 p-6 text-left shadow-sm flex flex-col max-h-[380px]">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
            <Mail className="w-5 h-5 text-[#C5A85C]" />
            <div>
              <h3 className="text-md font-bold text-[#0D4855]">
                Pending Invitations ({invitations.length})
              </h3>
              <p className="text-[9px] text-gray-400">Interns who haven't completed profile setup yet</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {invitations.length === 0 ? (
              <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col justify-center items-center h-full">
                <p className="text-xs text-gray-400 font-semibold">No pending invitations.</p>
              </div>
            ) : (
              invitations.map((invite) => {
                const inviteLink = `${window.location.origin}/?invite_token=${invite.token}`;
                return (
                  <div
                    key={invite.id}
                    className="p-3 bg-[#FAF8F5] border border-gray-200 rounded-2xl flex items-center justify-between gap-4"
                  >
                    <div className="flex flex-col text-left flex-1 min-w-0">
                      <span className="text-xs font-bold text-[#0D4855] truncate">
                        {invite.name}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium truncate">
                        {invite.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Copy Link */}
                      <button
                        onClick={() => handleCopyLink(inviteLink)}
                        className="px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-500 hover:text-[#0D4855] transition-all flex items-center gap-1"
                        title="Copy Link"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Link</span>
                      </button>

                      {/* Delete invite */}
                      <button
                        onClick={() => handleDeleteInvite(invite.id)}
                        className="p-1.5 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl text-gray-400 hover:text-red-600 transition-all"
                        title="Revoke invitation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Advanced Filters Panel */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50 p-6 text-left transition-all">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-[#C5A85C]" />
          <h4 className="text-xs uppercase tracking-wider font-bold text-[#0D4855]">
            Advanced Filters
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Keyword Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Intern or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
            />
          </div>

          {/* Intern Select */}
          <select
            value={selectedIntern}
            onChange={(e) => setSelectedIntern(e.target.value)}
            className="w-full px-3 py-2 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
          >
            <option value="all">All Interns</option>
            {interns.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
          </select>

          {/* Start Date */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#C5A85C]">
              <Calendar className="w-3.5 h-3.5" />
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
              title="Start Date"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#C5A85C]">
              <Calendar className="w-3.5 h-3.5" />
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
              title="End Date"
            />
          </div>
        </div>
      </div>

      {/* Main Data Table Panel */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50 p-6 md:p-8 text-left transition-all">
        
        {/* Table Title and Export options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#C5A85C]" />
            <div>
              <h3 className="text-lg font-bold text-[#0D4855]">
                Daily Logs Database
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Displaying {filteredReports.length} journals matching current filter constraints
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => exportToExcel(filteredReports)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-xs font-bold rounded-xl text-gray-600 shadow-sm transition-all"
            >
              <FileDown className="w-3.5 h-3.5 text-green-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => exportToPDF(filteredReports)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-xs font-bold rounded-xl text-gray-600 shadow-sm transition-all"
            >
              <FileDown className="w-3.5 h-3.5 text-red-500" />
              <span>Print PDF</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        {filteredReports.length === 0 ? (
          <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm text-gray-400 font-semibold">No journal reports found.</p>
            <p className="text-xs text-gray-400 mt-1">Adjust filters or search fields above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wider font-bold text-gray-400 pb-3.5">
                  <th className="pb-3.5 font-bold">Intern Name</th>
                  <th className="pb-3.5 font-bold">Date</th>
                  <th className="pb-3.5 font-bold">Hours</th>
                  <th className="pb-3.5 font-bold">Status</th>
                  <th className="pb-3.5 font-bold">Submitted At</th>
                  <th className="pb-3.5 font-bold text-right pr-4">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-xs text-[#0D4855]">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => onOpenReport(report)}
                    className="hover:bg-gray-50/70 transition-all cursor-pointer group"
                  >
                    <td className="py-4 font-bold text-sm text-[#0D4855]">
                      {report.intern_name || 'N/A'}
                    </td>
                    <td className="py-4 font-semibold text-gray-500">
                      {report.date}
                    </td>
                    <td className="py-4 font-semibold text-gray-500">
                      {report.hours_worked} hrs
                    </td>
                    <td className="py-4">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="py-4 font-semibold text-gray-450">
                      {report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-4 text-right pr-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenReport(report);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-100 text-[10px] font-bold rounded-lg border border-gray-200 text-gray-500 transition-all shadow-sm group-hover:border-[#C5A85C]/40 group-hover:text-[#0D4855]"
                      >
                        <Eye className="w-3 h-3 text-[#C5A85C]" />
                        <span>Journal</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
        </>
      )}

      {activeTab === 'daybook' && (
        <div className="space-y-6 text-left pb-12">
          {/* Daybook Filters */}
          <div className="bg-white rounded-3xl border border-gray-200/50 p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#C5A85C]" />
              <div>
                <h3 className="text-lg font-bold text-[#0D4855]">Intern Day Book</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Chronological feed of daily journals</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Search journals..."
                  value={daybookQuery}
                  onChange={(e) => setDaybookQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
                />
              </div>

              <select
                value={daybookIntern}
                onChange={(e) => setDaybookIntern(e.target.value)}
                className="px-3 py-2 bg-[#FAF8F5] border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
              >
                <option value="all">All Interns</option>
                {interns.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Daybook Feed */}
          <div className="space-y-6">
            {daybookReports.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/50 shadow-sm">
                <p className="text-sm text-gray-455 font-semibold">No journal entries found in the Day Book.</p>
                <p className="text-xs text-gray-400 mt-1">Try resetting the search query or select another intern.</p>
              </div>
            ) : (
              daybookReports.map((report) => (
                <DayBookCard 
                  key={report.id} 
                  report={report} 
                  adminUser={currentUser} 
                  onRefresh={fetchData} 
                  onOpenReport={onOpenReport}
                />
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <InternPerformanceView interns={interns} onOpenReport={onOpenReport} />
      )}

      {/* Mobile Floating Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/80 p-2.5 flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] rounded-t-3xl">
        <button
          onClick={() => {
            setActiveTab('overview');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1.5 px-4 py-1.5 rounded-2xl transition-all ${
            activeTab === 'overview'
              ? 'text-[#0D4855] font-extrabold scale-105'
              : 'text-gray-400 font-medium'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] tracking-wide">Overview</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('daybook');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1.5 px-4 py-1.5 rounded-2xl transition-all ${
            activeTab === 'daybook'
              ? 'text-[#0D4855] font-extrabold scale-105'
              : 'text-gray-400 font-medium'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] tracking-wide">Day Book</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('performance');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1.5 px-4 py-1.5 rounded-2xl transition-all ${
            activeTab === 'performance'
              ? 'text-[#0D4855] font-extrabold scale-105'
              : 'text-gray-400 font-medium'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] tracking-wide">Performance</span>
        </button>
      </div>

    </div>
  );
};
