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
    <div className="h-full flex flex-col p-2 sm:p-4 overflow-hidden gap-3">
      
      {/* Page Title */}
      <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="text-left hidden md:block">
          <h2 className="text-xl font-bold text-[#0D4855]">
            Admin Control Panel
          </h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex w-full md:w-auto items-center p-1 bg-[#FAF8F5] rounded-xl border border-gray-200 shadow-inner">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-[#0D4855] shadow-sm'
                : 'text-gray-500 hover:text-[#0D4855]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all ${
              activeTab === 'performance'
                ? 'bg-white text-[#0D4855] shadow-sm'
                : 'text-gray-500 hover:text-[#0D4855]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Performance
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-1">
          {/* Aggregate Cards */}
          <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 pb-1">
            {/* Total Interns */}
            <div className="min-w-[140px] flex-1 snap-start bg-white p-3 rounded-2xl border border-gray-200/50 shadow-sm flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-[#0D4855]/5 flex items-center justify-center text-[#0D4855]">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-lg font-bold text-[#0D4855] leading-none">
                  {stats.totalInterns}
                </span>
                <p className="text-[8px] uppercase tracking-wider font-bold text-gray-400 mt-0.5">
                  Interns
                </p>
              </div>
            </div>

            {/* Reports Today */}
            <div className="min-w-[140px] flex-1 snap-start bg-white p-3 rounded-2xl border border-gray-200/50 shadow-sm flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-green-500/5 flex items-center justify-center text-green-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-lg font-bold text-[#0D4855] leading-none">
                  {stats.reportsToday}
                </span>
                <p className="text-[8px] uppercase tracking-wider font-bold text-gray-400 mt-0.5">
                  Logs Today
                </p>
              </div>
            </div>

            {/* Pending Reports */}
            <div className="min-w-[140px] flex-1 snap-start bg-white p-3 rounded-2xl border border-gray-200/50 shadow-sm flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/5 flex items-center justify-center text-yellow-600">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-lg font-bold text-[#0D4855] leading-none">
                  {stats.pendingReports}
                </span>
                <p className="text-[8px] uppercase tracking-wider font-bold text-gray-400 mt-0.5">
                  Pending
                </p>
              </div>
            </div>

            {/* Total Hours */}
            <div className="min-w-[140px] flex-1 snap-start bg-white p-3 rounded-2xl border border-gray-200/50 shadow-sm flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-[#C5A85C]/5 flex items-center justify-center text-[#C5A85C]">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-lg font-bold text-[#0D4855] leading-none">
                  {stats.totalHours.toFixed(1)}
                </span>
                <p className="text-[8px] uppercase tracking-wider font-bold text-gray-400 mt-0.5">
                  Total Hrs
                </p>
              </div>
            </div>
          </div>

      {/* Intern Invites & Magic Links Management Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* Generate Invite Form */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200/50 p-4 text-left shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-[#C5A85C]" />
            <h3 className="text-sm font-bold text-[#0D4855]">
              Invite Intern
            </h3>
          </div>
          
          <form onSubmit={handleInvite} className="space-y-3">
            {inviteError && (
              <div className="p-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-bold">
                {inviteError}
              </div>
            )}
            
            {inviteSuccess && (
              <div className="p-2 bg-green-50 text-green-700 border border-green-100 rounded-lg text-[10px] font-bold">
                {inviteSuccess}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Name *"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-[#FAF8F5] border border-gray-200 rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] font-bold"
                required
              />
              <input
                type="email"
                placeholder="Email *"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-[#FAF8F5] border border-gray-200 rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] font-bold"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-1.5 bg-[#0D4855] text-white hover:bg-[#0A3D49] font-bold text-[10px] uppercase tracking-wider rounded-lg shadow-sm"
            >
              Generate Magic Link
            </button>
          </form>

          {/* Generated Magic Link Box */}
          {generatedLink && (
            <div className="mt-3 p-2 bg-[#FAF8F5] border border-[#C5A85C]/25 rounded-lg space-y-1.5">
              <span className="text-[8px] uppercase tracking-wider font-bold text-[#C5A85C]">
                Copy Secure Link
              </span>
              <div className="flex gap-1.5 items-center">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 bg-white border border-gray-200 px-2 py-1 rounded text-[9px] font-mono text-gray-600 focus:outline-none select-all"
                />
                <button
                  onClick={() => handleCopyLink(generatedLink)}
                  className="p-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded text-gray-500"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active / Pending Invitations List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/50 p-4 text-left shadow-sm flex flex-col max-h-[180px]">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-[#C5A85C]" />
              <h3 className="text-sm font-bold text-[#0D4855]">
                Pending ({invitations.length})
              </h3>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {invitations.length === 0 ? (
              <div className="text-center py-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <p className="text-[10px] text-gray-400 font-bold">No pending invitations.</p>
              </div>
            ) : (
              invitations.map((invite) => {
                const inviteLink = `${window.location.origin}/?invite_token=${invite.token}`;
                return (
                  <div
                    key={invite.id}
                    className="p-2 bg-[#FAF8F5] border border-gray-200 rounded-lg flex items-center justify-between gap-2"
                  >
                    <div className="flex flex-col text-left flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-[#0D4855] truncate">
                        {invite.name}
                      </span>
                      <span className="text-[8px] text-gray-500 font-medium truncate">
                        {invite.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleCopyLink(inviteLink)}
                        className="p-1.5 bg-white border border-gray-200 rounded text-gray-500 hover:text-[#0D4855]"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteInvite(invite.id)}
                        className="p-1.5 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-3 text-left transition-all flex-shrink-0">
        <div className="flex items-center gap-1.5 mb-2">
          <Filter className="w-3.5 h-3.5 text-[#C5A85C]" />
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-[#0D4855]">
            Filters
          </h4>
        </div>

        <div className="flex overflow-x-auto gap-2 pb-1 hide-scrollbar">
          {/* Keyword Search */}
          <div className="relative flex-shrink-0 w-32">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-400">
              <Search className="w-3 h-3" />
            </span>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-6 pr-2 py-1 bg-[#FAF8F5] border border-gray-200 rounded-lg text-[9px] font-bold focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
            />
          </div>

          {/* Intern Select */}
          <select
            value={selectedIntern}
            onChange={(e) => setSelectedIntern(e.target.value)}
            className="flex-shrink-0 w-24 px-2 py-1 bg-[#FAF8F5] border border-gray-200 rounded-lg text-[9px] font-bold focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
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
            className="flex-shrink-0 w-24 px-2 py-1 bg-[#FAF8F5] border border-gray-200 rounded-lg text-[9px] font-bold focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
          </select>

          {/* Start Date */}
          <div className="relative flex-shrink-0 w-28">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-[#C5A85C]">
              <Calendar className="w-3 h-3" />
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-6 pr-2 py-1 bg-[#FAF8F5] border border-gray-200 rounded-lg text-[9px] font-bold focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
              title="Start Date"
            />
          </div>

          {/* End Date */}
          <div className="relative flex-shrink-0 w-28">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-[#C5A85C]">
              <Calendar className="w-3 h-3" />
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-6 pr-2 py-1 bg-[#FAF8F5] border border-gray-200 rounded-lg text-[9px] font-bold focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
              title="End Date"
            />
          </div>
        </div>
      </div>

      {/* Main Data Table Panel */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200/50 p-3 flex flex-col min-h-0">
        
        {/* Table Title and Export options */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#C5A85C]" />
            <h3 className="text-sm font-bold text-[#0D4855]">
              Daily Logs ({filteredReports.length})
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => exportToExcel(filteredReports)}
              className="px-2 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-[9px] font-bold rounded text-green-600 shadow-sm"
            >
              CSV
            </button>
            <button
              onClick={() => exportToPDF(filteredReports)}
              className="px-2 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-[9px] font-bold rounded text-red-500 shadow-sm"
            >
              PDF
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {filteredReports.length === 0 ? (
            <div className="text-center py-8 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
              <p className="text-[10px] text-gray-400 font-bold">No journal reports found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[320px]">
              <thead className="sticky top-0 bg-white shadow-[0_1px_0_#f3f4f6]">
                <tr className="text-[8px] uppercase tracking-wider font-bold text-gray-400">
                  <th className="py-2 px-1">Intern</th>
                  <th className="py-2 px-1">Date</th>
                  <th className="py-2 px-1">Status</th>
                  <th className="py-2 px-1 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[10px] text-[#0D4855]">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => onOpenReport(report)}
                    className="hover:bg-gray-50/70 transition-all cursor-pointer group"
                  >
                    <td className="py-2 px-1 font-bold text-[#0D4855]">
                      {report.intern_name || 'N/A'}
                    </td>
                    <td className="py-2 px-1 font-semibold text-gray-500">
                      {report.date.split('-').slice(1).join('/')}
                    </td>
                    <td className="py-2 px-1">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="py-2 px-1 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenReport(report);
                        }}
                        className="inline-flex items-center justify-center w-6 h-6 bg-white hover:bg-gray-100 rounded border border-gray-200 text-[#C5A85C] shadow-sm"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
        </div>
      ) : (
        <InternPerformanceView interns={interns} onOpenReport={onOpenReport} />
      )}

    </div>
  );
};
