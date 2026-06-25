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
    <div className="h-full w-full max-w-7xl mx-auto flex flex-col p-3 md:p-6 lg:p-8 overflow-hidden gap-4 md:gap-6">
      {/* Header Area */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4">
          <BookOpen className="w-5 h-5 md:w-8 md:h-8 text-[#C5A85C]" />
          <div>
            <h2 className="text-xl md:text-3xl font-bold text-[#0D4855]">
              My Journal
            </h2>
            <p className="hidden md:block text-sm text-gray-500 mt-1 font-medium">
              Log your daily activities, challenges, and hours.
            </p>
          </div>
        </div>

        {/* Create New Action */}
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-3 bg-[#0D4855] text-white hover:bg-[#0A3D49] font-bold text-[10px] md:text-sm uppercase tracking-wider rounded-lg md:rounded-xl shadow-sm md:shadow-md transition-all"
        >
          <Plus className="w-3.5 h-3.5 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Write New Log</span>
          <span className="sm:hidden">New Log</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-6 pr-1 md:pr-2">
        {/* Statistics Cards - Horizontal on Mobile, Grid on Desktop */}
        <div className="md:col-span-12 flex overflow-x-auto md:grid md:grid-cols-2 lg:grid-cols-4 snap-x snap-mandatory hide-scrollbar gap-3 md:gap-6 pb-1 md:pb-0 flex-shrink-0">
          <div className="min-w-[140px] md:min-w-0 flex-1 snap-start bg-white p-3 md:p-6 rounded-2xl md:rounded-3xl border border-gray-200/50 shadow-sm flex items-center gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-[#0D4855]/5 flex items-center justify-center text-[#0D4855]">
              <Calendar className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <div>
              <span className="text-lg md:text-2xl font-bold text-[#0D4855] leading-none">
                {reports.length}
              </span>
              <p className="text-[8px] md:text-[10px] uppercase tracking-wider font-bold md:font-semibold text-gray-400 mt-0.5 md:mt-1">
                Total Logs
              </p>
            </div>
          </div>

          <div className="min-w-[140px] md:min-w-0 flex-1 snap-start bg-white p-3 md:p-6 rounded-2xl md:rounded-3xl border border-gray-200/50 shadow-sm flex items-center gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-[#C5A85C]/5 flex items-center justify-center text-[#C5A85C]">
              <Clock className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <div>
              <span className="text-lg md:text-2xl font-bold text-[#0D4855] leading-none">
                {weeklySummary.totalHours.toFixed(1)}
              </span>
              <p className="text-[8px] md:text-[10px] uppercase tracking-wider font-bold md:font-semibold text-gray-400 mt-0.5 md:mt-1">
                Total Hours
              </p>
            </div>
          </div>
        </div>

        {/* My Assigned Tasks Section */}
        <div className="md:col-span-4 bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-200/50 p-4 md:p-8 text-left flex flex-col min-h-0">
          <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-6 border-b border-gray-100 pb-2 md:pb-4">
            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-[#C5A85C]" />
            <h3 className="text-sm md:text-lg font-bold text-[#0D4855]">
              My Tasks
            </h3>
            <span className="ml-auto bg-[#FAF8F5] text-[#0D4855] text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-gray-200">
              {tasks.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[250px] md:max-h-full custom-scrollbar pr-1 md:pr-2">
            {tasks.length === 0 ? (
              <div className="text-center py-6 md:py-10 bg-gray-50/50 rounded-xl md:rounded-2xl border border-dashed border-gray-200">
                <p className="text-[10px] md:text-sm text-gray-400 font-bold md:font-semibold">No tasks assigned.</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {tasks.map(task => (
                  <div key={task.id} className="p-2.5 md:p-4 bg-[#FAF8F5] border border-gray-200 rounded-lg md:rounded-2xl flex items-start gap-2 md:gap-4 hover:border-gray-300 transition-colors">
                    <button
                      onClick={() => handleToggleTask(task.id, task.status)}
                      disabled={isUpdatingTask === task.id}
                      className={`mt-0.5 flex-shrink-0 flex items-center justify-center transition-colors ${
                        task.status === 'completed' ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-[#0D4855]'
                      }`}
                    >
                      {task.status === 'completed' ? <CheckCircle className="w-4 h-4 md:w-6 md:h-6" /> : <CircleDashed className="w-4 h-4 md:w-6 md:h-6" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-[10px] md:text-sm font-bold truncate md:whitespace-normal ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-[#0D4855]'}`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-[8px] md:text-xs text-gray-500 mt-0.5 md:mt-1 leading-tight line-clamp-2 md:line-clamp-none">
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
        <div className="md:col-span-8 flex-1 md:h-full bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-200/50 p-4 md:p-8 text-left min-h-0 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 mb-3 md:mb-6 pb-2 md:pb-5 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-sm md:text-lg font-bold text-[#0D4855] flex items-center gap-2">
              <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-[#C5A85C] hidden md:block" />
              Log History
            </h3>
            <div className="relative w-full sm:w-auto max-w-[150px] md:max-w-[200px]">
              <Search className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-gray-400" />
              <input
                type="date"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-6 md:pl-10 pr-2 md:pr-4 py-1.5 md:py-2.5 bg-[#FAF8F5] border border-gray-200 rounded-lg md:rounded-xl text-[9px] md:text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855] font-bold md:font-semibold"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 md:pr-2">
            {filteredReports.length === 0 ? (
              <div className="text-center py-10 md:py-16 bg-gray-50/50 rounded-xl md:rounded-2xl border border-dashed border-gray-200">
                <p className="text-[10px] md:text-sm text-gray-400 font-bold md:font-semibold">No reports found.</p>
                <p className="hidden md:block text-xs text-gray-400 mt-1">Try selecting a different date.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => onOpenReport(report)}
                    className="p-3 md:p-5 bg-white border border-gray-200 rounded-xl md:rounded-2xl shadow-sm hover:border-[#C5A85C]/40 hover:shadow-md transition-all cursor-pointer group flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-2 md:mb-3">
                      <div className="flex items-center gap-1.5 md:gap-2 text-[#0D4855] font-bold text-xs md:text-sm">
                        <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#C5A85C]" />
                        <span className="md:hidden">{report.date.split('-').slice(1).join('/')}</span>
                        <span className="hidden md:inline">{report.date}</span>
                      </div>
                      <div className="text-[9px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-md md:rounded bg-gray-100 text-gray-600">
                        {report.hours_worked}h
                      </div>
                    </div>
                    
                    <div className="mb-2 md:flex-1">
                      <h4 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5 md:mb-1">Objectives</h4>
                      <p className="text-[10px] md:text-xs text-[#0D4855] line-clamp-2 md:line-clamp-3 leading-tight md:leading-normal">
                        {report.objectives}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 md:mt-4 pt-2 md:pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-1 md:gap-1.5 text-gray-400">
                        <MessageSquare className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        <span className="text-[9px] md:text-xs font-bold">{report.comments?.length || 0} <span className="hidden md:inline">Comments</span></span>
                      </div>
                      <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2 md:px-2.5 py-0.5 md:py-1 rounded md:rounded-lg bg-[#FAF8F5] text-[#0D4855] border border-gray-200">
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
