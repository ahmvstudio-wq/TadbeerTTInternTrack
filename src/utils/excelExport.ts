import type { DailyReport } from '../types';

/**
 * Escapes characters for CSV values to ensure compatibility with Excel.
 * Replaces double quotes with escaped quotes and surrounds values containing commas or newlines in quotes.
 */
const escapeCSVValue = (val: any): string => {
  if (val === null || val === undefined) return '';
  let str = String(val);
  // Remove formatting that breaks excel cells or escape them
  str = str.replace(/"/g, '""');
  // If it has commas, quotes, or newlines, wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str}"`;
  }
  return str;
};

export const exportToExcel = (reports: DailyReport[]) => {
  const headers = [
    'Intern Name',
    'Date',
    'Start Time',
    'End Time',
    'Hours Worked',
    'Status',
    'Today\'s Objectives',
    'Work Completed',
    'Challenges / Blockers',
    'Suggestions / Ideas',
    'Waiting For',
    'Tomorrow\'s Plan',
    'Submitted At'
  ];

  const rows = reports.map(r => [
    r.intern_name || 'N/A',
    r.date,
    r.start_time,
    r.end_time,
    r.hours_worked,
    r.status.toUpperCase(),
    r.objectives,
    r.work_completed,
    r.challenges || '',
    r.suggestions || '',
    r.waiting_for || '',
    r.tomorrow_plan,
    r.created_at ? new Date(r.created_at).toLocaleString() : 'N/A'
  ]);

  const csvContent = [
    headers.map(escapeCSVValue).join(','),
    ...rows.map(row => row.map(escapeCSVValue).join(','))
  ].join('\r\n');

  // Create downloadable blob
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const todayStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `Tadbeer_Intern_Reports_${todayStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
