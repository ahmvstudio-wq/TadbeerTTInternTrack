export type ReportStatus = 'completed' | 'in_progress' | 'blocked';

export type UserRole = 'admin' | 'intern';

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  role_title?: string;
  work_profile?: string;
  objectives_to_achieve?: string;
  created_at: string;
}

export interface DailyReport {
  id: string;
  intern_id: string;
  intern_name?: string; // resolved locally or via join
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  hours_worked: number;
  objectives: string;
  work_completed: string;
  challenges: string;
  suggestions: string;
  waiting_for: string;
  tomorrow_plan: string;
  status: ReportStatus;
  created_at: string;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  report_id: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  comment_text: string;
  created_at: string;
}

export interface WeeklySummary {
  totalHours: number;
  reportsSubmitted: number;
  completedDays: number;
  blockedDays: number;
}

export interface Invitation {
  id: string;
  email: string;
  token: string;
  name: string;
  created_at: string;
}

export interface InternTask {
  id: string;
  intern_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  created_at: string;
}
