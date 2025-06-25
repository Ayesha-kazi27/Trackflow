export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  task_name: string;
  category: 'Work' | 'Study' | 'Personal' | 'Other';
  start_time: string;
  end_time: string;
  duration_minutes: number;
  productivity_rating: number;
  created_at: string;
  date: string;
}

export interface Goal {
  id: string;
  user_id: string;
  type: 'daily' | 'weekly';
  target_type: 'tasks' | 'rating';
  target_value: number;
  is_active: boolean;
  created_at: string;
}

export interface UserStats {
  user_id: string;
  total_tasks: number;
  average_productivity: number;
  current_streak: number;
  longest_streak: number;
  last_activity: string;
}

export interface AuthContextType {
  user: User | null;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}