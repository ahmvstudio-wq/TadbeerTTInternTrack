import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { Profile, DailyReport, InternTask } from '../types';
import { Users, TrendingUp, CheckCircle, Plus, Calendar, Target, Clock, Activity, AlertCircle, CircleDashed, Trash2, UserCircle2 } from 'lucide-react';

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
      <div className="flex-1 flex flex-col min-h-0 bg-[#FAF8F5] rounded-xl md:rounded-3xl p-3 md:p-6 lg:p-8 border border-gray-200">
        {!selectedIntern ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 h-full">
            <UserCircle2 className="w-10 h-10 md:w-16 md:h-16 mb-2 md:mb-4 text-gray-300" />
            <p className="text-[10px] md:text-base font-bold text-center">Select an intern to view their performance metrics.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 gap-3 md:gap-6 custom-scrollbar overflow-y-auto pr-1 md:pr-2">
              
              <div className="flex overflow-x-auto md:grid md:grid-cols-4 snap-x snap-mandatory hide-scrollbar md:hide-scrollbar-none gap-2 md:gap-4 pb-1 md:pb-0 flex-shrink-0">
                <div className="min-w-[120px] md:min-w-0 flex-1 snap-start bg-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-gray-200/50 flex flex-col gap-1 md:gap-2 shadow-sm">
                  <div className="flex items-center gap-1.5 md:gap-2 text-[#C5A85C]">
                    <Activity className="w-3.5 h-3.5 md:w-5 md:h-5" />
                    <span className="text-[8px] md:text-xs font-bold uppercase tracking-wider text-gray-400">Total Logs</span>
                  </div>
                  <span className="text-lg md:text-3xl font-bold text-[#0D4855]">{reports.length}</span>
                </div>
                <div className="min-w-[120px] md:min-w-0 flex-1 snap-start bg-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-gray-200/50 flex flex-col gap-1 md:gap-2 shadow-sm">
                  <div className="flex items-center gap-1.5 md:gap-2 text-[#C5A85C]">
                    <Clock className="w-3.5 h-3.5 md:w-5 md:h-5" />
                    <span className="text-[8px] md:text-xs font-bold uppercase tracking-wider text-gray-400">Total Hours</span>
                  </div>
                  <span className="text-lg md:text-3xl font-bold text-[#0D4855]">{totalHours.toFixed(1)}</span>
                </div>
                <div className="min-w-[120px] md:min-w-0 flex-1 snap-start bg-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-gray-200/50 flex flex-col gap-1 md:gap-2 shadow-sm">
                  <div className="flex items-center gap-1.5 md:gap-2 text-green-500">
                    <CheckCircle className="w-3.5 h-3.5 md:w-5 md:h-5" />
                    <span className="text-[8px] md:text-xs font-bold uppercase tracking-wider text-gray-400">Tasks Done</span>
                  </div>
                  <span className="text-lg md:text-3xl font-bold text-[#0D4855]">{completedTasks}</span>
                </div>
                <div className="min-w-[120px] md:min-w-0 flex-1 snap-start bg-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-gray-200/50 flex flex-col gap-1 md:gap-2 shadow-sm">
                  <div className="flex items-center gap-1.5 md:gap-2 text-yellow-500">
                    <AlertCircle className="w-3.5 h-3.5 md:w-5 md:h-5" />
                    <span className="text-[8px] md:text-xs font-bold uppercase tracking-wider text-gray-400">Tasks Pend.</span>
                  </div>
                  <span className="text-lg md:text-3xl font-bold text-[#0D4855]">{pendingTasks}</span>
                </div>
              </div>

              {/* Graphical Illustration: 14-Day Hours Worked Chart */}
              <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200/50 shadow-sm p-3 md:p-6 flex-shrink-0">
                <h3 className="text-[10px] md:text-sm font-bold text-[#0D4855] mb-2 md:mb-4 flex items-center gap-1.5 md:gap-2">
                  <Target className="w-3.5 h-3.5 md:w-5 md:h-5 text-[#C5A85C]" />
                  14-Day Activity Tracker
                </h3>
                
                {/* Pure CSS Bar Chart */}
                <div className="h-32 md:h-48 flex items-end justify-between gap-1 mt-2 md:mt-4 border-b border-gray-100 pb-2 relative">
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
                          className="w-full max-w-[12px] md:max-w-[24px] bg-gradient-to-t from-[#0D4855] to-[#1A6C7E] rounded-t-sm transition-all duration-300 group-hover:from-[#C5A85C] group-hover:to-[#D9C07A] relative"
                          style={{ height: `${heightPercent}%`, minHeight: d.hours > 0 ? '4px' : '0' }}
                        >
                          {/* Tooltip */}
                          <div className="absolute -top-6 md:-top-8 left-1/2 -translate-x-1/2 bg-[#0D4855] text-white text-[8px] md:text-[10px] py-0.5 md:py-1 px-1.5 md:px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md font-bold">
                            {d.hours} hrs
                          </div>
                        </div>
                        <span className={`text-[6px] md:text-[8px] mt-1.5 md:mt-2 font-bold transform -rotate-45 -translate-x-1 md:-translate-x-2 ${isWeekend ? 'text-gray-300' : 'text-gray-500'}`}>
                          {d.date.split('-').slice(1).join('/')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-3 md:gap-6">
                <div className="flex-1 flex flex-col min-h-[200px] lg:min-h-0 bg-white border border-gray-200 rounded-xl md:rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-[#FAF8F5] p-2.5 md:p-4 border-b border-gray-200 flex items-center justify-between">
                    <h4 className="text-[10px] md:text-sm font-bold text-[#0D4855] uppercase tracking-wider">
                      Tasks Assigned
                    </h4>
                    <form onSubmit={handleAssignTask} className="flex items-center gap-1 md:gap-2">
                      <input
                        type="text"
                        placeholder="New task..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-28 md:w-48 px-2 md:px-3 py-1 md:py-1.5 bg-white border border-gray-200 rounded md:rounded-lg text-[9px] md:text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
                      />
                      <button
                        type="submit"
                        disabled={isAssigning || !newTaskTitle.trim()}
                        className="p-1 md:p-1.5 bg-[#0D4855] text-white rounded md:rounded-lg hover:bg-[#0A3D49] disabled:opacity-50 transition-all"
                      >
                        <Plus className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </form>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 custom-scrollbar">
                    {tasks.length === 0 ? (
                      <div className="text-center py-6 md:py-10 text-[10px] md:text-xs text-gray-400 font-bold border border-dashed border-gray-200 rounded-lg">
                        No tasks assigned.
                      </div>
                    ) : (
                      tasks.map(task => (
                        <div key={task.id} className="p-2 md:p-3 bg-[#FAF8F5] border border-gray-200 rounded-lg flex items-center justify-between gap-2 md:gap-3">
                          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                            {task.status === 'completed' ? (
                              <CheckCircle className="w-3.5 h-3.5 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                            ) : (
                              <CircleDashed className="w-3.5 h-3.5 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-[10px] md:text-sm font-bold truncate ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-[#0D4855]'}`}>
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-[8px] md:text-xs text-gray-500 truncate mt-0.5">{task.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-[200px] lg:min-h-0 bg-white border border-gray-200 rounded-xl md:rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-[#FAF8F5] p-2.5 md:p-4 border-b border-gray-200">
                    <h4 className="text-[10px] md:text-sm font-bold text-[#0D4855] uppercase tracking-wider">
                      Recent Daily Logs
                    </h4>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 custom-scrollbar">
                    {reports.length === 0 ? (
                      <div className="text-center py-6 md:py-10 text-[10px] md:text-xs text-gray-400 font-bold border border-dashed border-gray-200 rounded-lg">
                        No reports submitted.
                      </div>
                    ) : (
                      reports.map(report => (
                        <div 
                          key={report.id}
                          onClick={() => onOpenReport(report)}
                          className="p-2.5 md:p-4 bg-[#FAF8F5] border border-gray-200 rounded-lg md:rounded-xl flex flex-col gap-2 md:gap-3 cursor-pointer hover:border-[#C5A85C]/50 hover:bg-white transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#C5A85C]" />
                              <span className="text-[10px] md:text-sm font-bold text-[#0D4855]">{report.date}</span>
                            </div>
                            <span className="text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-gray-100 text-gray-600">
                              {report.hours_worked}h
                            </span>
                          </div>
                          <p className="text-[10px] md:text-xs text-[#0D4855] line-clamp-2 md:line-clamp-3 font-medium">
                            {report.work_completed}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};
