import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { DailyReport, Profile, Invitation } from '../types';
import { exportToExcel } from '../utils/excelExport';
import { exportToPDF } from '../utils/pdfExport';
import { Users, FileText, AlertCircle, Clock, Search, Filter, Calendar, FileDown, Eye, CheckCircle2, Link2, Copy, Check, Trash2, Mail, LayoutDashboard, TrendingUp } from 'lucide-react';
import { InternPerformanceView } from './InternPerformanceView';

interface AdminDashboardProps {
  onOpenReport: (report: DailyReport) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenReport }) => {
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
  const [activeTab, setActiveTab] = useState<'overview' | 'performance'>('overview');

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
        <div className="text-left">
          <h2 className="text-3xl font-bold text-[#0D4855]">
            Admin Control Panel
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Monitor intern progress, manage magic link invites, and review performance.
          </p>
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

      {activeTab === 'overview' ? (
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
      ) : (
        <InternPerformanceView interns={interns} onOpenReport={onOpenReport} />
      )}

      {/* Mobile Floating Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/80 p-2.5 flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] rounded-t-3xl">
        <button
          onClick={() => {
            setActiveTab('overview');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1.5 px-6 py-1 rounded-2xl transition-all ${
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
            setActiveTab('performance');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1.5 px-6 py-1 rounded-2xl transition-all ${
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
