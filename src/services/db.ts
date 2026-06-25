import { supabase } from './supabaseClient';
import type { DailyReport, Comment, Profile, ReportStatus, WeeklySummary, UserRole, InternTask } from '../types';

const ensureSupabase = () => {
  if (!supabase) throw new Error('Supabase client not initialized');
};

export const dbService = {
  // Authentication (Supabase only)
  login: async (email: string, _role: UserRole, password?: string): Promise<{ profile: Profile; token: string }> => {
    // Hard limit check for Admin: Only allow these specific admin credentials
    const adminEmails = ['w.taufiqq@gmail.com', 'operation@tadbeertt.com'];
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!email || !adminEmails.includes(normalizedEmail)) {
      throw new Error('Access denied. Only authorized administrators can login here.');
    }
    if (!password) {
      throw new Error('Password is required.');
    }

    let userId: string | undefined;

    // 1. Try to sign in
    const { data: authData, error: authError } = await supabase!.auth.signInWithPassword({
      email: normalizedEmail,
      password: password,
    });

    if (authError) {
      // 2. If sign in fails, it might be the first time, auto-register the admin
      const { data: signUpData, error: signUpError } = await supabase!.auth.signUp({
        email: normalizedEmail,
        password: password,
      });

      if (signUpError) {
        throw new Error(`Admin sign up failed: ${signUpError.message}`);
      }
      
      if (signUpData.user) {
        userId = signUpData.user.id;
      } else {
        throw new Error('Admin sign up failed: No user returned');
      }
    } else {
      userId = authData?.user?.id;
    }

    if (!userId) {
      throw new Error('Login failed: Could not determine User ID.');
    }

    // 3. Fetch the profile
    const { data: profile } = await supabase!.from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle to avoid the "Cannot coerce" error when 0 rows are returned

    // 4. If profile doesn't exist (e.g. previous insert failed), create it now!
    if (!profile) {
      const { data: newProfile, error: insertError } = await supabase!.from('profiles').insert([
        {
          id: userId,
          name: normalizedEmail === 'w.taufiqq@gmail.com' ? 'Taufiqq' : 'Operation Admin',
          role: 'admin',
          email: normalizedEmail,
        }
      ]).select().single();

      if (insertError) {
        throw new Error(`Failed to create admin profile row: ${insertError.message}`);
      }

      return { profile: newProfile, token: authData?.session?.access_token || '' };
    }

    return { profile, token: authData?.session?.access_token || '' };
  },

  // Fetch all interns
  getInterns: async (): Promise<Profile[]> => {
    const { data, error } = await supabase!
      .from('profiles')
      .select('*')
      .eq('role', 'intern')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  // Fetch daily reports
  getReports: async (filters?: {
    internId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: ReportStatus;
    keyword?: string;
  }): Promise<DailyReport[]> => {
    let query = supabase!
      .from('daily_reports')
      .select(`
        *,
        profiles:intern_id (name),
        comments (
          *,
          author:profiles!author_id (name, role)
        )
      `);

    if (filters?.internId) {
      query = query.eq('intern_id', filters.internId);
    }
    if (filters?.date) {
      query = query.eq('date', filters.date);
    }
    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;

    let reports: DailyReport[] = (data || []).map((r: any) => ({
      id: r.id,
      intern_id: r.intern_id,
      intern_name: r.profiles?.name || 'Unknown',
      date: r.date,
      start_time: r.start_time,
      end_time: r.end_time,
      hours_worked: Number(r.hours_worked),
      objectives: r.objectives,
      work_completed: r.work_completed,
      challenges: r.challenges || '',
      suggestions: r.suggestions || '',
      waiting_for: r.waiting_for || '',
      tomorrow_plan: r.tomorrow_plan,
      status: r.status,
      created_at: r.created_at,
      comments: r.comments?.map((c: any) => ({
        id: c.id,
        report_id: c.report_id,
        author_id: c.author_id,
        author_name: c.author?.name || 'Staff',
        author_role: c.author?.role || 'intern',
        comment_text: c.comment_text,
        created_at: c.created_at,
      })) || [],
    }));

    if (filters?.keyword) {
      const kw = filters.keyword.toLowerCase();
      reports = reports.filter(
        r =>
          (r.intern_name && r.intern_name.toLowerCase().includes(kw)) ||
          r.date.includes(kw) ||
          r.objectives.toLowerCase().includes(kw) ||
          r.work_completed.toLowerCase().includes(kw) ||
          (r.challenges && r.challenges.toLowerCase().includes(kw)) ||
          (r.suggestions && r.suggestions.toLowerCase().includes(kw)) ||
          (r.waiting_for && r.waiting_for.toLowerCase().includes(kw)) ||
          r.tomorrow_plan.toLowerCase().includes(kw)
      );
    }

    return reports;
  },

  // Submit or update report
  submitReport: async (report: Omit<DailyReport, 'id' | 'created_at'> & { id?: string }): Promise<DailyReport> => {
    const payload = {
      intern_id: report.intern_id,
      date: report.date,
      start_time: report.start_time,
      end_time: report.end_time,
      hours_worked: report.hours_worked,
      objectives: report.objectives,
      work_completed: report.work_completed,
      challenges: report.challenges || null,
      suggestions: report.suggestions || null,
      waiting_for: report.waiting_for || null,
      tomorrow_plan: report.tomorrow_plan,
      status: report.status,
    };

    let result;
    if (report.id) {
      const { data, error } = await supabase!
        .from('daily_reports')
        .update(payload)
        .eq('id', report.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase!
        .from('daily_reports')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    // Get intern profile name
    const { data: profile } = await supabase!
      .from('profiles')
      .select('name')
      .eq('id', report.intern_id)
      .single();

    return {
      id: result.id,
      intern_id: result.intern_id,
      intern_name: profile?.name || 'Unknown Intern',
      date: result.date,
      start_time: result.start_time,
      end_time: result.end_time,
      hours_worked: Number(result.hours_worked),
      objectives: result.objectives,
      work_completed: result.work_completed,
      challenges: result.challenges || '',
      suggestions: result.suggestions || '',
      waiting_for: result.waiting_for || '',
      tomorrow_plan: result.tomorrow_plan,
      status: result.status,
      created_at: result.created_at,
      comments: [],
    };
  },

  // Add Comment on report
  addComment: async (reportId: string, authorId: string, commentText: string): Promise<Comment> => {
    const { data, error } = await (supabase!
      .from('comments')
      .insert([{ report_id: reportId, author_id: authorId, comment_text: commentText }])
      .select(`
        *,
        author:profiles!author_id (name, role)
      `) as any)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      report_id: data.report_id,
      author_id: data.author_id,
      author_name: data.author?.name || 'Staff',
      author_role: data.author?.role || 'intern',
      comment_text: data.comment_text,
      created_at: data.created_at,
    };
  },

  // Calculate weekly summary
  calculateWeeklySummary: (reports: DailyReport[], internId?: string): WeeklySummary => {
    const filteredReports = internId ? reports.filter(r => r.intern_id === internId) : reports;
    const uniqueDays = new Set(filteredReports.map(r => r.date));
    const totalHours = filteredReports.reduce((acc, r) => acc + r.hours_worked, 0);
    const completedDays = filteredReports.filter(r => r.status === 'completed').length;
    const blockedDays = filteredReports.filter(r => r.status === 'blocked').length;

    return {
      totalHours,
      reportsSubmitted: uniqueDays.size,
      completedDays,
      blockedDays,
    };
  },

  // Admin Dashboard stats
  getAdminDashboardStats: async (): Promise<{
    totalInterns: number;
    reportsToday: number;
    pendingReports: number;
    totalHours: number;
  }> => {
    const interns = await dbService.getInterns();
    const reports = await dbService.getReports();
    
    const todayStr = new Date().toISOString().split('T')[0];
    const reportsToday = reports.filter(r => r.date === todayStr).length;
    const totalInterns = interns.length;
    const pendingReports = Math.max(0, totalInterns - reportsToday);
    const totalHours = reports.reduce((acc, r) => acc + r.hours_worked, 0);

    return {
      totalInterns,
      reportsToday,
      pendingReports,
      totalHours,
    };
  },

  // Invite Intern
  inviteIntern: async (email: string, name: string): Promise<string> => {
    const token = Math.random().toString(36).substr(2, 9) + '-' + Math.random().toString(36).substr(2, 9);
    
    const { error } = await supabase!
      .from('invitations')
      .insert([{ email, token, name }]);
    
    if (error) {
      throw new Error(error.message || 'Failed to create invitation.');
    }

    return `${window.location.origin}/?invite_token=${token}`;
  },

  // ===================== Tasks Operations =====================

  getInternTasks: async (internId: string): Promise<InternTask[]> => {
    ensureSupabase();
    const { data, error } = await supabase!
      .from('intern_tasks')
      .select('*')
      .eq('intern_id', internId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }
    return data || [];
  },

  createInternTask: async (internId: string, title: string, description?: string): Promise<void> => {
    ensureSupabase();
    const { error } = await supabase!
      .from('intern_tasks')
      .insert([{ intern_id: internId, title, description }]);

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }
  },

  updateTaskStatus: async (taskId: string, status: 'pending' | 'completed'): Promise<void> => {
    ensureSupabase();
    const { error } = await supabase!
      .from('intern_tasks')
      .update({ status })
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to update task status: ${error.message}`);
    }
  },

  // ===================== Invitation Management =====================

  // Get invitations
  getInvitations: async (): Promise<any[]> => {
    const { data, error } = await supabase!
      .from('invitations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Delete invitation
  deleteInvitation: async (id: string): Promise<void> => {
    const { error } = await supabase!.from('invitations').delete().eq('id', id);
    if (error) throw error;
  },

  // Verify invitation token
  verifyInvitationToken: async (token: string): Promise<any> => {
    const { data, error } = await supabase!
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single();
    
    if (error || !data) {
      throw new Error('Invalid or expired invitation token.');
    }
    return data;
  },

  // Complete Intern Registration
  completeInternRegistration: async (token: string, name: string, roleTitle: string, workProfile: string, objectivesToAchieve: string): Promise<Profile> => {
    const invite = await dbService.verifyInvitationToken(token);

    const { data: authData, error: authError } = await supabase!.auth.signUp({
      email: invite.email,
      password: token,
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to register account.');
    }

    const { data: profile, error: profileError } = await supabase!
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          name,
          role: 'intern',
          email: invite.email,
          role_title: roleTitle,
          work_profile: workProfile,
          objectives_to_achieve: objectivesToAchieve,
        }
      ])
      .select()
      .single();

    if (profileError) {
      throw new Error(profileError.message || 'Failed to initialize profile.');
    }

    return profile;
  },

  // Login with token
  loginWithToken: async (token: string, email: string): Promise<Profile> => {
    const { data: authData, error: authError } = await supabase!.auth.signInWithPassword({
      email,
      password: token,
    });
    
    if (authError || !authData.user) {
      throw new Error('Magic link login failed. You may need to ask your admin to re-send the link.');
    }
    
    const { data: profile, error: profileError } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError || !profile) {
      throw new Error('Profile details setup incomplete.');
    }
    return profile;
  },

  // Sign out
  logout: async (): Promise<void> => {
    await supabase!.auth.signOut();
  }
};

