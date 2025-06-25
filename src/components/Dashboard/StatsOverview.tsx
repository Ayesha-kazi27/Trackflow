import React from 'react';
import { Clock, Target, Star, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { format } from 'date-fns';
import type { Task } from '../../types';

interface StatsOverviewProps {
  tasks: Task[];
  userName: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ tasks, userName }) => {
  const today = new Date();
  const totalTasks = tasks.length;
  const totalTime = tasks.reduce((sum, task) => sum + task.duration_minutes, 0);
  const averageProductivity = totalTasks > 0 
    ? tasks.reduce((sum, task) => sum + task.productivity_rating, 0) / totalTasks 
    : 0;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">
            {format(today, 'EEEE, MMMM d, yyyy')}
          </p>
          <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
            Focus Better. Work Smarter.
          </p>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalTasks}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tasks Today
              </p>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatDuration(totalTime)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Time
              </p>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="flex items-center space-x-1 mb-1">
                {renderStars(averageProductivity)}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Avg. Productivity
              </p>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round(averageProductivity * 10) / 10}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Daily Score
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};