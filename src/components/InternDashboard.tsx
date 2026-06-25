import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { Profile, DailyReport, InternTask } from '../types';
import { Calendar, Clock, Search, BookOpen, MessageSquare, Plus, CheckCircle, CircleDashed } from 'lucide-react';
import { ReportFormModal } from './ReportFormModal';
import { PlantGrower } from './PlantGrower';

interface InternDashboardProps {
  user: Profile;
  onOpenReport: (report: DailyReport) => void;
}

export const InternDashboard: React.FC<InternDashboardProps> = ({ user, onOpenReport }) => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [tasks, setTasks] = useState<InternTask[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const fetchData = async () => {
    try {
      const [reportsData, tasksData] = await Promise.all([
        dbService.getReportsByIntern(user.id),
        dbService.getTasksForIntern(user.id)
      ]);
      setReports(reportsData);
      setTasks(tasksData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    try {
      setIsUpdatingTask(taskId);
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await dbService.updateTaskStatus(taskId, newStatus as 'pending' | 'completed');
      await fetchData();
    } catch (err) {
      console.error('Failed to toggle task', err);
    } finally {
      setIsUpdatingTask(null);
    }
  };

  const weeklySummary = dbService.calculateWeeklySummary(reports);
  const filteredReports = reports.filter(r => r.date.includes(searchTerm));

  return (
    <div className="h-full flex flex-col p-2 sm:p-4 overflow-hidden gap-3">
      {/* Header Area */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#C5A85C]" />
          <div>
            <h2 className="text-xl font-bold text-[#0D4855]">
              My Journal
            </h2>
          </div>
        </div>

        {/* Create New Action */}
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D4855] text-white hover:bg-[#0A3D49] font-bold text-[10px] uppercase tracking-wider rounded-lg shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Log</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-1">
        {/* Statistics Cards */}
        <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 pb-1 flex-shrink-0">
          <div className="min-w-[140px] flex-1 snap-start bg-white p-3 rounded-2xl border border-gray-200/50 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0D4855]/5 flex items-center justify-center text-[#0D4855]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-lg font-bold text-[#0D4855] leading-none">
                {reports.length}
              </span>
              <p className="text-[8px] uppercase tracking-wider font-bold text-gray-400 mt-0.5">
                Total Logs
              </p>
            </div>
          </div>

          <div className="min-w-[140px] flex-1 snap-start bg-white p-3 rounded-2xl border border-gray-200/50 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C5A85C]/5 flex items-center justify-center text-[#C5A85C]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-lg font-bold text-[#0D4855] leading-none">
                {weeklySummary.totalHours.toFixed(1)}
              </span>
              <p className="text-[8px] uppercase tracking-wider font-bold text-gray-400 mt-0.5">
                Total Hours
              </p>
            </div>
          </div>
        </div>

        {/* My Assigned Tasks Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-3 text-left">
          <div className="flex items-center gap-1.5 mb-2 border-b border-gray-100 pb-2">
            <CheckCircle className="w-4 h-4 text-[#C5A85C]" />
            <h3 className="text-sm font-bold text-[#0D4855]">
              My Tasks ({tasks.length})
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[150px] custom-scrollbar">
            {tasks.length === 0 ? (
              <div className="text-center py-4 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                <p className="text-[10px] text-gray-400 font-bold">No tasks assigned.</p>
              </div>
            ) : (
              <div className="space-y-2 pr-1">
                {tasks.map(task => (
                  <div key={task.id} className="p-2 bg-[#FAF8F5] border border-gray-200 rounded-lg flex items-start gap-2">
                    <button
                      onClick={() => handleToggleTask(task.id, task.status)}
                      disabled={isUpdatingTask === task.id}
                      className={`mt-0.5 flex-shrink-0 flex items-center justify-center transition-colors ${
                        task.status === 'completed' ? 'text-green-500' : 'text-gray-400 hover:text-[#0D4855]'
                      }`}
                    >
                      {task.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : <CircleDashed className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-[10px] font-bold truncate ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-[#0D4855]'}`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-[8px] text-gray-500 mt-0.5 leading-tight line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filter and Reports List */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200/50 p-3 text-left min-h-0 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-sm font-bold text-[#0D4855]">
              Log History
            </h3>
            <div className="relative w-full max-w-[120px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="date"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-6 pr-2 py-1 bg-[#FAF8F5] border border-gray-200 rounded text-[9px] focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] font-bold"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredReports.length === 0 ? (
              <div className="text-center py-8 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                <p className="text-[10px] text-gray-400 font-bold">No reports found.</p>
              </div>
            ) : (
              <div className="space-y-2 pr-1">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => onOpenReport(report)}
                    className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#C5A85C]/40 hover:shadow transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1.5 text-[#0D4855] font-bold text-xs">
                        <Calendar className="w-3.5 h-3.5 text-[#C5A85C]" />
                        {report.date.split('-').slice(1).join('/')}
                      </div>
                      <div className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {report.hours_worked}h
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Objectives</h4>
                      <p className="text-[10px] text-[#0D4855] line-clamp-2 leading-tight">
                        {report.objectives}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-1 text-gray-400">
                        <MessageSquare className="w-3 h-3" />
                        <span className="text-[9px] font-bold">{report.comments?.length || 0}</span>
                      </div>
                      <div className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#FAF8F5] text-[#0D4855] border border-gray-200">
                        {report.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isReportModalOpen && (
        <ReportFormModal
          internId={user.id}
          internName={user.name}
          onClose={() => setIsReportModalOpen(false)}
          onSubmitSuccess={() => {
            fetchData();
            setIsReportModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
