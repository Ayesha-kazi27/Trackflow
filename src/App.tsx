import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SignIn } from './components/Auth/SignIn';
import { SignUp } from './components/Auth/SignUp';
import { Header } from './components/Layout/Header';
import { StatsOverview } from './components/Dashboard/StatsOverview';
import { TaskForm } from './components/Dashboard/TaskForm';
import { TaskList } from './components/Dashboard/TaskList';
import { ProductivityChart } from './components/Analytics/ProductivityChart';
import { GoalManager } from './components/Goals/GoalManager';
import { Leaderboard } from './components/Leaderboard/Leaderboard';
import { ExportReports } from './components/Reports/ExportReports';
import { supabase, testConnection } from './lib/supabase';
import type { Task } from './types';

const AppContent: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  
  const { user, loading: authLoading } = useAuth();

  // Test Supabase connection on app load
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await testConnection();
      if (!isConnected) {
        setConnectionError(true);
        setError('Unable to connect to the database. Please check your internet connection and try again.');
      }
    };
    
    checkConnection();
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100); // Limit to improve performance

      if (error) {
        console.error('Error fetching tasks:', error);
        setError('Failed to load tasks. Please try refreshing the page.');
        setTasks([]);
      } else {
        setTasks(data || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks. Please check your connection and try again.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !connectionError) {
      fetchTasks();
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [user, fetchTasks, connectionError]);

  const handleTaskAdded = useCallback((newTask: Task) => {
    setTasks(prevTasks => [newTask, ...prevTasks]);
  }, []);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        setError('Failed to delete task. Please try again.');
        return;
      }
      
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again.');
    }
  }, []);

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Track Flow...</p>
        </div>
      </div>
    );
  }

  // Show connection error
  if (connectionError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-100 dark:bg-red-900 rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Connection Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Unable to connect to the database. This might be because the Supabase environment variables are not configured in the deployed environment.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!user) {
    return isSignUp ? (
      <SignUp onToggleMode={() => setIsSignUp(false)} />
    ) : (
      <SignIn onToggleMode={() => setIsSignUp(true)} />
    );
  }

  const getTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(task => task.date === today);
  };

  const renderCurrentView = () => {
    const todayTasks = getTodayTasks();
    
    switch (currentView) {
      case 'analytics':
        return <ProductivityChart tasks={tasks} />;
      case 'goals':
        return <GoalManager tasks={todayTasks} />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'reports':
        return <ExportReports tasks={tasks} userName={user.full_name || 'User'} />;
      default:
        return (
          <div className="space-y-6">
            <StatsOverview tasks={todayTasks} userName={user.full_name || 'User'} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TaskForm onTaskAdded={handleTaskAdded} />
              <TaskList tasks={todayTasks} onDeleteTask={handleDeleteTask} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => {
                setError(null);
                fetchTasks();
              }}
              className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading your data...</p>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            {renderCurrentView()}
          </div>
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;