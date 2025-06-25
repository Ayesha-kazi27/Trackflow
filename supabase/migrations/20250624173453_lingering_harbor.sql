/*
  # Track Flow Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - Links to auth.users
      - `email` (text, unique)
      - `full_name` (text)
      - `created_at` (timestamp)
    
    - `tasks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `task_name` (text)
      - `category` (text) - Work, Study, Personal, Other
      - `start_time` (text) - Time in HH:MM format
      - `end_time` (text) - Time in HH:MM format
      - `duration_minutes` (integer)
      - `productivity_rating` (integer, 1-5)
      - `date` (date) - Task completion date
      - `created_at` (timestamp)
    
    - `goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `type` (text) - daily, weekly
      - `target_type` (text) - tasks, rating
      - `target_value` (numeric)
      - `is_active` (boolean)
      - `created_at` (timestamp)
    
    - `user_stats`
      - `user_id` (uuid, primary key, foreign key to users)
      - `total_tasks` (integer)
      - `average_productivity` (numeric)
      - `current_streak` (integer)
      - `longest_streak` (integer)
      - `last_activity` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own tasks, goals, and stats
    - User stats are readable by all authenticated users for leaderboard
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Work', 'Study', 'Personal', 'Other')),
  start_time text NOT NULL,
  end_time text NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  productivity_rating integer NOT NULL CHECK (productivity_rating >= 1 AND productivity_rating <= 5),
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('daily', 'weekly')),
  target_type text NOT NULL CHECK (target_type IN ('tasks', 'rating')),
  target_value numeric NOT NULL CHECK (target_value > 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_tasks integer DEFAULT 0,
  average_productivity numeric DEFAULT 0 CHECK (average_productivity >= 0 AND average_productivity <= 5),
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Tasks table policies
CREATE POLICY "Users can manage own tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Goals table policies
CREATE POLICY "Users can manage own goals"
  ON goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User stats table policies
CREATE POLICY "Users can read all user stats for leaderboard"
  ON user_stats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own stats"
  ON user_stats
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_active ON goals(user_id, is_active);