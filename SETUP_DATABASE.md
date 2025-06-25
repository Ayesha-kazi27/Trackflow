# Database Setup Instructions

Your application is failing because the database tables haven't been created yet. Follow these steps to set up your database schema:

## Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project

## Step 2: Apply Database Schema
1. In your Supabase dashboard, go to the **SQL Editor** tab
2. Click **New Query**
3. Copy and paste the entire SQL schema below into the editor
4. Click **Run** to execute the schema

## Step 3: SQL Schema to Execute

```sql
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
  WITH CHECK (id = (auth.jwt() ->> 'sub')::uuid);

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
```

## Step 4: Verify Setup
After running the SQL:
1. Go to the **Table Editor** tab in your Supabase dashboard
2. You should see the following tables:
   - users
   - tasks
   - goals
   - user_stats

## Step 5: Test Your Application
Once the database schema is applied, refresh your application and try signing up or signing in again. The errors should be resolved.

---

**Note:** The migration file in your project (`supabase/migrations/20250624173453_lingering_harbor.sql`) contains the same schema, but it needs to be applied to your actual Supabase database to work.