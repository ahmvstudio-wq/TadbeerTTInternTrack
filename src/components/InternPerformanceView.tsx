import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { Profile, DailyReport, InternTask } from '../types';
import { Users, TrendingUp, CheckCircle, Plus, Calendar, Target, Clock, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

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

  // Detailed Chart Data Preparation (Last 14 days)
  const last14Days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = last14Days.map(date => {
    const dayReports = reports.filter(r => r.date === date);
    const dayTasks = tasks.filter(t => t.created_at.startsWith(date) && t.status === 'completed');
    
    const hrs = dayReports.reduce((sum, r) => sum + Number(r.hours_worked || 0), 0);
    const challengesText = dayReports.map(r => r.challenges).filter(Boolean).join(' | ');
    const workCompletedText = dayReports.map(r => r.work_completed).filter(Boolean).join(' | ');
    const objectivesText = dayReports.map(r => r.objectives).filter(Boolean).join(' | ');

    return { 
      date, 
      displayDate: date.split('-').slice(1).join('/'),
      hours: hrs,
      tasksCompleted: dayTasks.length,
      challenges: challengesText,
      work_completed: workCompletedText,
      objectives: objectivesText,
      isToday: date === new Date().toISOString().split('T')[0]
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#C5A85C]/30 max-w-xs z-50">
          <p className="text-xs font-bold text-[#0D4855] uppercase tracking-wider mb-3 pb-2 border-b border-gray-100 flex justify-between items-center">
            <span>{data.date}</span>
            {data.isToday && <span className="text-[9px] bg-[#C5A85C]/20 text-[#C5A85C] px-2 py-0.5 rounded-full">TODAY</span>}
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#0D4855]" />
              <span className="text-sm font-bold text-gray-700">{data.hours} <span className="text-xs font-normal text-gray-500">Hours Worked</span></span>
            </div>
            {data.tasksCompleted > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#C5A85C]" />
                <span className="text-sm font-bold text-gray-700">{data.tasksCompleted} <span className="text-xs font-normal text-gray-500">Extra Tasks Completed</span></span>
              </div>
            )}
            
            {data.work_completed && (
              <div className="mt-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                <p className="text-[10px] font-bold text-[#0D4855] mb-1">Work Completed</p>
                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">{data.work_completed}</p>
              </div>
            )}
            
            {data.challenges && (
              <div className="mt-2 bg-red-50 p-2.5 rounded-lg border border-red-100 flex gap-2 items-start">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-red-700 mb-0.5">Challenges Faced</p>
                  <p className="text-[11px] text-red-600 line-clamp-2 leading-relaxed">{data.challenges}</p>
                </div>
              </div>
            )}
            
            {data.hours === 0 && !data.work_completed && (
              <div className="text-center py-2 text-xs text-gray-400 italic">No activity logged</div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar: Interns List (order-2 on mobile so graph shows first) */}
      <div className="w-full md:w-1/4 bg-white rounded-3xl border border-gray-200/50 shadow-sm p-5 h-fit order-2 md:order-1">
        <h3 className="text-md font-bold text-[#0D4855] flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <Users className="w-5 h-5 text-[#C5A85C]" />
          Select Intern
        </h3>
        <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
          {interns.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No interns found</p>
          ) : (
            interns.map(intern => (
              <button
                key={intern.id}
                onClick={() => setSelectedInternId(intern.id)}
                className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  selectedInternId === intern.id
                    ? 'bg-[#0D4855] text-white shadow-md'
                    : 'bg-[#FAF8F5] text-[#0D4855] hover:bg-gray-100'
                }`}
              >
                {intern.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content: Intern Performance Details (order-1 on mobile so it's prioritized) */}
      <div className="w-full md:w-3/4 space-y-6 order-1 md:order-2">
        {!selectedIntern ? (
          <div className="bg-white rounded-3xl border border-gray-200/50 shadow-sm p-12 text-center text-gray-400">
            Select an intern from the list to view their performance metrics.
          </div>
        ) : (
          <>
            {/* Intern Profile Header Area */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200/50 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#C5A85C]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-[#0D4855]">{selectedIntern.name}</h2>
                  {selectedIntern.role_title && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0D4855]/5 text-[#0D4855] text-xs font-bold rounded-full border border-[#0D4855]/10">
                      <Target className="w-3.5 h-3.5 text-[#C5A85C]" />
                      {selectedIntern.role_title}
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Context Area */}
              {(selectedIntern.work_profile || selectedIntern.objectives_to_achieve) && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                  {selectedIntern.work_profile && (
                    <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-gray-100">
                      <h4 className="text-[10px] font-bold text-[#C5A85C] tracking-widest uppercase mb-2">Work Profile</h4>
                      <p className="text-sm text-[#0D4855] leading-relaxed font-medium">{selectedIntern.work_profile}</p>
                    </div>
                  )}
                  {selectedIntern.objectives_to_achieve && (
                    <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-gray-100">
                      <h4 className="text-[10px] font-bold text-[#C5A85C] tracking-widest uppercase mb-2">Objectives</h4>
                      <p className="text-sm text-[#0D4855] leading-relaxed font-medium">{selectedIntern.objectives_to_achieve}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Header / Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200/50 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#0D4855]/5 flex items-center justify-center text-[#0D4855]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-bold text-[#0D4855]">{totalHours.toFixed(1)}</span>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mt-0.5">Total Hours</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200/50 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#C5A85C]/10 flex items-center justify-center text-[#C5A85C]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-bold text-[#0D4855]">{avgHoursPerDay}</span>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mt-0.5">Avg Hrs / Day</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200/50 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-bold text-[#0D4855]">{daysActive}</span>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mt-0.5">Active Days</p>
                </div>
              </div>
            </div>

            {/* Graphical Illustration: 14-Day Hours Worked Chart */}
            <div className="bg-white rounded-3xl border border-gray-200/50 shadow-sm p-6 md:p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#FAF8F5]/30 pointer-events-none" />
              
              <h3 className="text-md font-bold text-[#0D4855] mb-8 flex items-center gap-2 relative z-10">
                <TrendingUp className="w-5 h-5 text-[#C5A85C]" />
                Detailed Performance Timeline
              </h3>
              
              {/* Recharts Composed Chart */}
              <div className="h-72 w-full relative z-10 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0D4855" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#0D4855" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorToday" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C5A85C" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#C5A85C" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                    <XAxis 
                      dataKey="displayDate" 
                      tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 600 }} 
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                      dy={10}
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 600 }} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val}h`}
                      dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#FAF8F5', opacity: 0.5 }} />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="hours" 
                      stroke="#0D4855" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorHours)" 
                      activeDot={{ r: 6, fill: '#C5A85C', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="hours" 
                      barSize={20}
                      radius={[4, 4, 0, 0]}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isToday ? 'url(#colorToday)' : 'transparent'} stroke={entry.isToday ? '#C5A85C' : 'transparent'} strokeWidth={1} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Task Manager */}
              <div className="bg-white rounded-3xl border border-gray-200/50 shadow-sm p-6 flex flex-col">
                <h3 className="text-md font-bold text-[#0D4855] mb-4 flex items-center gap-2 pb-3 border-b border-gray-100">
                  <CheckCircle className="w-5 h-5 text-[#C5A85C]" />
                  Extra Tasks
                </h3>
                
                {/* Add Task Form */}
                <form onSubmit={handleAssignTask} className="mb-5 space-y-3 bg-[#FAF8F5] p-4 rounded-2xl border border-gray-150">
                  <div>
                    <input
                      type="text"
                      placeholder="Task Title *"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
                      required
                    />
                  </div>
                  <div>
                    <textarea
                      rows={2}
                      placeholder="Optional description or instructions..."
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#C5A85C] text-[#0D4855]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAssigning || !newTaskTitle.trim()}
                    className="flex items-center justify-center gap-1 w-full py-2 bg-[#0D4855] text-white hover:bg-[#0A3D49] font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Assign Task
                  </button>
                </form>

                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1 custom-scrollbar">
                  {tasks.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4 font-medium">No tasks assigned yet.</p>
                  ) : (
                    tasks.map(task => (
                      <div key={task.id} className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm flex items-start gap-3">
                        <div className="mt-0.5">
                          {task.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                          )}
                        </div>
                        <div>
                          <h4 className={`text-xs font-bold ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-[#0D4855]'}`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[10px] text-gray-500 mt-1 leading-relaxed whitespace-pre-wrap">
                              {task.description}
                            </p>
                          )}
                          <p className="text-[8px] text-gray-400 mt-1.5 font-semibold uppercase tracking-wider">
                            Assigned: {new Date(task.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Logs History */}
              <div className="bg-white rounded-3xl border border-gray-200/50 shadow-sm p-6 flex flex-col">
                <h3 className="text-md font-bold text-[#0D4855] mb-4 flex items-center gap-2 pb-3 border-b border-gray-100">
                  <Calendar className="w-5 h-5 text-[#C5A85C]" />
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
