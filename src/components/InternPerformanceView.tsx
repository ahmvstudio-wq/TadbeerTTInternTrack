import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { Profile, DailyReport, InternTask } from '../types';
import { Users, TrendingUp, CheckCircle, Plus, Calendar, Target, Clock } from 'lucide-react';

interface Props {
  interns: Profile[];
  onOpenReport: (report: DailyReport) => void;
}

export const InternPerformanceView: React.FC<Props> = ({ interns, onOpenReport }) => {
  const [selectedInternId, setSelectedInternId] = useState<string | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [tasks, setTasks] = useState<InternTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (interns.length > 0 && !selectedInternId) {
      setSelectedInternId(interns[0].id);
    }
  }, [interns, selectedInternId]);

  const fetchInternData = async (internId: string) => {
    try {
      const [fetchedReports, fetchedTasks] = await Promise.all([
        dbService.getReports({ internId }),
        dbService.getInternTasks(internId)
      ]);
      setReports(fetchedReports);
      setTasks(fetchedTasks);
    } catch (err) {
      console.error('Error fetching intern data:', err);
    }
  };

  useEffect(() => {
    if (selectedInternId) {
      fetchInternData(selectedInternId);
    }
  }, [selectedInternId]);

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInternId || !newTaskTitle.trim()) return;

    setIsAssigning(true);
    try {
      await dbService.createInternTask(selectedInternId, newTaskTitle.trim(), newTaskDesc.trim());
      setNewTaskTitle('');
      setNewTaskDesc('');
      fetchInternData(selectedInternId);
    } catch (err) {
      console.error('Error assigning task:', err);
      alert('Failed to assign task');
    } finally {
      setIsAssigning(false);
    }
  };

  const selectedIntern = interns.find(i => i.id === selectedInternId);

  // Performance Calculations
  const totalHours = reports.reduce((sum, r) => sum + Number(r.hours_worked || 0), 0);
  const daysActive = new Set(reports.map(r => r.date)).size;
  const avgHoursPerDay = daysActive > 0 ? (totalHours / daysActive).toFixed(1) : '0';

  // Bar Chart Data Preparation (Last 14 days)
  const last14Days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = last14Days.map(date => {
    const dayReports = reports.filter(r => r.date === date);
    const hrs = dayReports.reduce((sum, r) => sum + Number(r.hours_worked || 0), 0);
    return { date, hours: hrs };
  });

  const maxHours = Math.max(...chartData.map(d => d.hours), 8); // At least 8 for scale

  return (
    <div className="h-full flex flex-col gap-3 min-h-0">
      {/* Top Bar: Interns Horizontal Select */}
      <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm p-3 flex-shrink-0">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[#C5A85C]" />
          Select Intern
        </h3>
        <div className="flex overflow-x-auto gap-2 pb-1 custom-scrollbar snap-x">
          {interns.length === 0 ? (
            <p className="text-[10px] text-gray-400 text-center w-full">No interns found</p>
          ) : (
            interns.map(intern => (
              <button
                key={intern.id}
                onClick={() => setSelectedInternId(intern.id)}
                className={`snap-start flex-shrink-0 text-left px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  selectedInternId === intern.id
                    ? 'bg-[#0D4855] text-white shadow-sm'
                    : 'bg-[#FAF8F5] text-[#0D4855] border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {intern.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content: Intern Performance Details */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-1">
        {!selectedIntern ? (
          <div className="bg-white rounded-3xl border border-gray-200/50 shadow-sm p-12 text-center text-gray-400">
            Select an intern from the list to view their performance metrics.
          </div>
        ) : (
          <>
            {/* Header / Top Stats */}
            <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 pb-1 flex-shrink-0">
              <div className="min-w-[120px] flex-1 snap-start bg-white p-3 rounded-2xl border border-gray-200/50 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0D4855]/5 flex items-center justify-center text-[#0D4855]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-lg font-bold text-[#0D4855] leading-none">{totalHours.toFixed(1)}</span>
                  <p className="text-[8px] uppercase tracking-wider font-bold text-gray-400 mt-0.5">Total Hrs</p>
                </div>
              </div>
              <div className="min-w-[120px] flex-1 snap-start bg-white p-3 rounded-2xl border border-gray-200/50 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C5A85C]/10 flex items-center justify-center text-[#C5A85C]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-lg font-bold text-[#0D4855] leading-none">{avgHoursPerDay}</span>
                  <p className="text-[8px] uppercase tracking-wider font-bold text-gray-400 mt-0.5">Hrs/Day</p>
                </div>
              </div>
              <div className="min-w-[120px] flex-1 snap-start bg-white p-3 rounded-2xl border border-gray-200/50 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-lg font-bold text-[#0D4855] leading-none">{daysActive}</span>
                  <p className="text-[8px] uppercase tracking-wider font-bold text-gray-400 mt-0.5">Active</p>
                </div>
              </div>
            </div>

            {/* Graphical Illustration: 14-Day Hours Worked Chart */}
            <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm p-4">
              <h3 className="text-sm font-bold text-[#0D4855] mb-2 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#C5A85C]" />
                14-Day Activity Tracker
              </h3>
              
              {/* Pure CSS Bar Chart */}
              <div className="h-48 flex items-end justify-between gap-1 mt-4 border-b border-gray-100 pb-2 relative">
                {/* Horizontal Guide Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-t border-dashed border-gray-400 w-full"></div>
                  <div className="border-t border-dashed border-gray-400 w-full"></div>
                  <div className="border-t border-dashed border-gray-400 w-full"></div>
                </div>

                {chartData.map((d, i) => {
                  const heightPercent = (d.hours / maxHours) * 100;
                  const isWeekend = new Date(d.date).getDay() === 0 || new Date(d.date).getDay() === 6;
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 group z-10">
                      <div 
                        className="w-full max-w-[24px] bg-gradient-to-t from-[#0D4855] to-[#1A6C7E] rounded-t-sm transition-all duration-300 group-hover:from-[#C5A85C] group-hover:to-[#D9C07A] relative"
                        style={{ height: `${heightPercent}%`, minHeight: d.hours > 0 ? '4px' : '0' }}
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0D4855] text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          {d.hours} hrs
                        </div>
                      </div>
                      <span className={`text-[8px] mt-2 font-bold transform -rotate-45 -translate-x-1 ${isWeekend ? 'text-gray-300' : 'text-gray-500'}`}>
                        {d.date.split('-').slice(1).join('/')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
              {/* Task Manager */}
              <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm p-4 flex flex-col">
                <h3 className="text-sm font-bold text-[#0D4855] mb-2 flex items-center gap-1.5 pb-2 border-b border-gray-100">
                  <CheckCircle className="w-4 h-4 text-[#C5A85C]" />
                  Extra Tasks
                </h3>
                
                {/* Add Task Form */}
                <form onSubmit={handleAssignTask} className="mb-3 space-y-2 bg-[#FAF8F5] p-2.5 rounded-xl border border-gray-150">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Task Title *"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isAssigning || !newTaskTitle.trim()}
                      className="flex-shrink-0 flex items-center justify-center gap-1 px-3 bg-[#0D4855] text-white hover:bg-[#0A3D49] font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Optional description..."
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
                    />
                  </div>
                </form>

                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto max-h-[200px] space-y-2 pr-1 custom-scrollbar">
                  {tasks.length === 0 ? (
                    <p className="text-[10px] text-gray-400 text-center py-4 font-bold">No tasks assigned.</p>
                  ) : (
                    tasks.map(task => (
                      <div key={task.id} className="p-2 bg-[#FAF8F5] border border-gray-200 rounded-lg flex items-start gap-2">
                        <div className="mt-0.5">
                          {task.status === 'completed' ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-gray-300"></div>
                          )}
                        </div>
                        <div>
                          <h4 className={`text-[10px] font-bold ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-[#0D4855]'}`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[8px] text-gray-500 mt-0.5 leading-tight line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Logs History */}
              <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm p-4 flex flex-col">
                <h3 className="text-sm font-bold text-[#0D4855] mb-2 flex items-center gap-1.5 pb-2 border-b border-gray-100">
                  <Calendar className="w-4 h-4 text-[#C5A85C]" />
                  Recent Submissions
                </h3>
                <div className="flex-1 overflow-y-auto max-h-[460px] space-y-3 pr-1 custom-scrollbar">
                  {reports.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4 font-medium">No reports submitted.</p>
                  ) : (
                    reports.slice(0, 10).map(report => (
                      <div 
                        key={report.id} 
                        onClick={() => onOpenReport(report)}
                        className="p-4 bg-[#FAF8F5] border border-gray-150 rounded-xl cursor-pointer hover:border-[#C5A85C]/30 hover:bg-white hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-[#0D4855]">{report.date}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            report.status === 'completed' ? 'bg-green-100 text-green-700' :
                            report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {report.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-600 line-clamp-2 leading-relaxed">
                          {report.work_completed}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
