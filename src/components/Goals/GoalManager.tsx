import React, { useState, useEffect, useCallback } from 'react';
import { Target, Plus, Award, Flame, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Goal, Task } from '../../types';

interface GoalManagerProps {
  tasks: Task[];
}

export const GoalManager: React.FC<GoalManagerProps> = ({ tasks }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    type: 'daily' as 'daily' | 'weekly',
    targetType: 'tasks' as 'tasks' | 'rating',
    targetValue: 5,
  });

  const { user } = useAuth();

  const fetchGoals = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching goals:', error);
        setError('Failed to load goals');
        return;
      }
      
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setError('Failed to load goals');
    }
  }, [user]);

  const calculateStreak = useCallback(async () => {
    if (!user) return;

    try {
      const { data: stats } = await supabase
        .from('user_stats')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle();

      setStreak(stats?.current_streak || 0);
    } catch (error) {
      console.error('Error fetching streak:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchGoals();
      calculateStreak();
    }
  }, [user, fetchGoals, calculateStreak]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert([
          {
            user_id: user.id,
            type: formData.type,
            target_type: formData.targetType,
            target_value: formData.targetValue,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating goal:', error);
        setError('Failed to create goal');
        return;
      }

      setGoals(prevGoals => [data, ...prevGoals]);
      setShowForm(false);
      setFormData({
        type: 'daily',
        targetType: 'tasks',
        targetValue: 5,
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      setError('Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      setError(null);
      const { error } = await supabase
        .from('goals')
        .update({ is_active: false })
        .eq('id', goalId);

      if (error) {
        console.error('Error deleting goal:', error);
        setError('Failed to delete goal');
        return;
      }
      
      setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
      setError('Failed to delete goal');
    }
  };

  const checkGoalProgress = (goal: Goal) => {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(task => task.date === today);

    if (goal.target_type === 'tasks') {
      return {
        current: todayTasks.length,
        target: goal.target_value,
        achieved: todayTasks.length >= goal.target_value,
      };
    } else {
      const avgRating = todayTasks.length > 0 
        ? todayTasks.reduce((sum, task) => sum + task.productivity_rating, 0) / todayTasks.length 
        : 0;
      return {
        current: Math.round(avgRating * 10) / 10,
        target: goal.target_value,
        achieved: avgRating >= goal.target_value,
      };
    }
  };

  const typeOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
  ];

  const targetTypeOptions = [
    { value: 'tasks', label: 'Number of Tasks' },
    { value: 'rating', label: 'Average Rating' },
  ];

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchGoals();
            }}
            className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Streak Card */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Flame className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {streak} Day{streak !== 1 ? 's' : ''}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Current Streak</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Award className="h-12 w-12 text-yellow-500" />
            <Button
              variant="secondary"
              size="sm"
              onClick={calculateStreak}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Goals Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Target className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Goals
          </h2>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchGoals}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>
      </div>

      {/* Add Goal Form */}
      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Goal Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'daily' | 'weekly' })}
                options={typeOptions}
              />
              <Select
                label="Target Type"
                value={formData.targetType}
                onChange={(e) => setFormData({ ...formData, targetType: e.target.value as 'tasks' | 'rating' })}
                options={targetTypeOptions}
              />
            </div>
            
            <Input
              label={`Target ${formData.targetType === 'tasks' ? 'Number of Tasks' : 'Average Rating'}`}
              type="number"
              min={formData.targetType === 'rating' ? '1' : '1'}
              max={formData.targetType === 'rating' ? '5' : '50'}
              step={formData.targetType === 'rating' ? '0.1' : '1'}
              value={formData.targetValue}
              onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
            />

            <div className="flex space-x-2">
              <Button type="submit" loading={loading}>
                Create Goal
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No active goals. Create your first goal to start tracking progress!
              </p>
            </div>
          </Card>
        ) : (
          goals.map((goal) => {
            const progress = checkGoalProgress(goal);
            const progressPercentage = Math.min((progress.current / progress.target) * 100, 100);

            return (
              <Card key={goal.id}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                      {goal.type} {goal.target_type === 'tasks' ? 'Task' : 'Rating'} Goal
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Target: {goal.target_value} {goal.target_type === 'tasks' ? 'tasks' : 'average rating'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {progress.achieved && (
                      <Award className="h-6 w-6 text-yellow-500" />
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {progress.current} / {progress.target}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        progress.achieved 
                          ? 'bg-success-500' 
                          : 'bg-primary-500'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  {progress.achieved && (
                    <p className="text-success-600 dark:text-success-400 text-sm font-medium">
                      🎉 Goal achieved!
                    </p>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};