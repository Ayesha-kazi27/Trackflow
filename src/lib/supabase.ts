import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-my-custom-header': 'track-flow'
    }
  }
});

// Test connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
};

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
        };
        Update: {
          email?: string;
          full_name?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          task_name: string;
          category: string;
          start_time: string;
          end_time: string;
          duration_minutes: number;
          productivity_rating: number;
          created_at: string;
          date: string;
        };
        Insert: {
          user_id: string;
          task_name: string;
          category: string;
          start_time: string;
          end_time: string;
          duration_minutes: number;
          productivity_rating: number;
          date: string;
        };
        Update: {
          task_name?: string;
          category?: string;
          start_time?: string;
          end_time?: string;
          duration_minutes?: number;
          productivity_rating?: number;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          target_type: string;
          target_value: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: string;
          target_type: string;
          target_value: number;
          is_active?: boolean;
        };
        Update: {
          target_value?: number;
          is_active?: boolean;
        };
      };
      user_stats: {
        Row: {
          user_id: string;
          total_tasks: number;
          average_productivity: number;
          current_streak: number;
          longest_streak: number;
          last_activity: string;
        };
        Insert: {
          user_id: string;
          total_tasks?: number;
          average_productivity?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity?: string;
        };
        Update: {
          total_tasks?: number;
          average_productivity?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity?: string;
        };
      };
    };
  };
}