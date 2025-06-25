import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '../ui/Card';
import type { Task } from '../../types';

interface ProductivityChartProps {
  tasks: Task[];
}

export const ProductivityChart: React.FC<ProductivityChartProps> = ({ tasks }) => {
  // Category data for pie chart
  const categoryData = tasks.reduce((acc, task) => {
    const existing = acc.find(item => item.name === task.category);
    if (existing) {
      existing.value += task.duration_minutes;
      existing.count += 1;
    } else {
      acc.push({
        name: task.category,
        value: task.duration_minutes,
        count: 1,
      });
    }
    return acc;
  }, [] as { name: string; value: number; count: number }[]);

  // Productivity rating distribution
  const ratingData = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: tasks.filter(task => task.productivity_rating === rating).length,
  }));

  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Time by Category */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Time Spent by Category
        </h3>
        
        {categoryData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatTime(value), 'Time']}
                    labelFormatter={(label) => `Category: ${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3">
              {categoryData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatTime(item.value)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.count} task{item.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No data available. Add some tasks to see your category breakdown.
          </div>
        )}
      </Card>

      {/* Productivity Rating Distribution */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Productivity Rating Distribution
        </h3>
        
        {tasks.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="rating" 
                  className="text-gray-600 dark:text-gray-400"
                  tickFormatter={(value) => `${value} ⭐`}
                />
                <YAxis className="text-gray-600 dark:text-gray-400" />
                <Tooltip 
                  formatter={(value: number) => [value, 'Tasks']}
                  labelFormatter={(label) => `${label} Star Rating`}
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg)',
                    border: '1px solid var(--tooltip-border)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No data available. Add some tasks to see your productivity distribution.
          </div>
        )}
      </Card>
    </div>
  );
};