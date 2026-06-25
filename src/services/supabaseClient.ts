import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase client is not initialized. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your env settings.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
