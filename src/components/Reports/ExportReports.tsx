import React, { useState } from 'react';
import { Download, FileText, Table } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { exportToPDF, exportToCSV } from '../../utils/export';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import type { Task } from '../../types';

interface ExportReportsProps {
  tasks: Task[];
  userName: string;
}

export const ExportReports: React.FC<ExportReportsProps> = ({ tasks, userName }) => {
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(false);

  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'all', label: 'All Time' },
  ];

  const getDateRange = (period: string) => {
    const today = new Date();
    switch (period) {
      case 'today':
        return {
          start: format(today, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd'),
          label: format(today, 'MMMM d, yyyy'),
        };
      case 'yesterday':
        const yesterday = subDays(today, 1);
        return {
          start: format(yesterday, 'yyyy-MM-dd'),
          end: format(yesterday, 'yyyy-MM-dd'),
          label: format(yesterday, 'MMMM d, yyyy'),
        };
      case 'thisWeek':
        return {
          start: format(startOfWeek(today), 'yyyy-MM-dd'),
          end: format(endOfWeek(today), 'yyyy-MM-dd'),
          label: `Week of ${format(startOfWeek(today), 'MMMM d, yyyy')}`,
        };
      case 'lastWeek':
        const lastWeekStart = startOfWeek(subDays(today, 7));
        const lastWeekEnd = endOfWeek(subDays(today, 7));
        return {
          start: format(lastWeekStart, 'yyyy-MM-dd'),
          end: format(lastWeekEnd, 'yyyy-MM-dd'),
          label: `Week of ${format(lastWeekStart, 'MMMM d, yyyy')}`,
        };
      case 'thisMonth':
        return {
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd'),
          label: format(today, 'MMMM yyyy'),
        };
      case 'lastMonth':
        const lastMonth = subDays(startOfMonth(today), 1);
        return {
          start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          end: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
          label: format(lastMonth, 'MMMM yyyy'),
        };
      default:
        return {
          start: '',
          end: '',
          label: 'All Time',
        };
    }
  };

  const getFilteredTasks = () => {
    if (period === 'all') return tasks;
    
    const { start, end } = getDateRange(period);
    return tasks.filter(task => task.date >= start && task.date <= end);
  };

  const handleExport = async (format: 'pdf' | 'csv') => {
    setLoading(true);
    try {
      const filteredTasks = getFilteredTasks();
      const { label } = getDateRange(period);
      
      if (format === 'pdf') {
        exportToPDF(filteredTasks, label, userName);
      } else {
        exportToCSV(filteredTasks, label);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = getFilteredTasks();
  const totalTime = filteredTasks.reduce((sum, task) => sum + task.duration_minutes, 0);
  const avgProductivity = filteredTasks.length > 0 
    ? filteredTasks.reduce((sum, task) => sum + task.productivity_rating, 0) / filteredTasks.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Download className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Export Reports
        </h2>
      </div>

      <Card>
        <div className="space-y-6">
          <div>
            <Select
              label="Select Period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              options={periodOptions}
            />
          </div>

          {/* Preview Stats */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              Report Preview - {getDateRange(period).label}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total Tasks:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {filteredTasks.length}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total Time:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {Math.floor(totalTime / 60)}h {totalTime % 60}m
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Avg. Productivity:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {avgProductivity.toFixed(1)}/5
                </span>
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => handleExport('pdf')}
              loading={loading}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Export as PDF</span>
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => handleExport('csv')}
              loading={loading}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <Table className="h-4 w-4" />
              <span>Export as CSV</span>
            </Button>
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No tasks found for the selected period.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};