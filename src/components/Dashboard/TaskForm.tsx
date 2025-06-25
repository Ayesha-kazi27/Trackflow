import React, { useState } from 'react';
import { Plus, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Task } from '../../types';

interface TaskFormProps {
  onTaskAdded: (task: Task) => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onTaskAdded }) => {
  const [taskName, setTaskName] = useState('');
  const [category, setCategory] = useState('Work');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [productivityRating, setProductivityRating] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const categories = [
    { value: 'Work', label: 'Work' },
    { value: 'Study', label: 'Study' },
    { value: 'Personal', label: 'Personal' },
    { value: 'Other', label: 'Other' },
  ];

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(`2000-01-01 ${start}`);
    const endDate = new Date(`2000-01-01 ${end}`);
    
    if (endDate <= startDate) {
      // Handle next day scenario
      endDate.setDate(endDate.getDate() + 1);
    }
    
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      if (!taskName.trim() || !startTime || !endTime) {
        throw new Error('Please fill in all required fields');
      }

      const duration = calculateDuration(startTime, endTime);
      if (duration <= 0) {
        throw new Error('End time must be after start time');
      }

      const taskData = {
        user_id: user.id,
        task_name: taskName.trim(),
        category: category as Task['category'],
        start_time: startTime,
        end_time: endTime,
        duration_minutes: duration,
        productivity_rating: productivityRating,
        date: new Date().toISOString().split('T')[0],
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        throw new Error('Failed to create task. Please try again.');
      }

      onTaskAdded(data);

      // Reset form
      setTaskName('');
      setStartTime('');
      setEndTime('');
      setProductivityRating(3);
      
      // Update user stats in background
      updateUserStats().catch(err => 
        console.error('Error updating user stats:', err)
      );
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStats = async () => {
    if (!user) return;

    try {
      // Get current user stats
      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Get user's tasks to calculate new stats
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);

      if (tasks) {
        const totalTasks = tasks.length;
        const averageProductivity = tasks.reduce((sum, task) => sum + task.productivity_rating, 0) / totalTasks;

        await supabase
          .from('user_stats')
          .upsert({
            user_id: user.id,
            total_tasks: totalTasks,
            average_productivity: Math.round(averageProductivity * 100) / 100,
            current_streak: stats?.current_streak || 0,
            longest_streak: stats?.longest_streak || 0,
            last_activity: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  };

  return (
    <Card>
      <div className="flex items-center space-x-2 mb-6">
        <Plus className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Add New Task
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <Input
          label="Task Name"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="What did you work on?"
          required
        />

        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={categories}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Clock className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
            <Input
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="pl-10"
              required
            />
          </div>
          <div className="relative">
            <Clock className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
            <Input
              label="End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Productivity Rating: {productivityRating}/5
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={productivityRating}
            onChange={(e) => setProductivityRating(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Add Task
        </Button>
      </form>
    </Card>
  );
};