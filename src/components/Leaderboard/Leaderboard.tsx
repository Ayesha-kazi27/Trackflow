import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Star, Target } from 'lucide-react';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { UserStats } from '../../types';

interface LeaderboardEntry extends UserStats {
  full_name: string;
  rank: number;
}

export const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'total_tasks' | 'average_productivity' | 'current_streak'>('total_tasks');
  
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select(`
          *,
          users!inner(full_name)
        `)
        .order(sortBy, { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedData = data?.map((entry, index) => ({
        ...entry,
        full_name: entry.users.full_name,
        rank: index + 1,
      })) || [];

      setLeaderboard(formattedData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
            {rank}
          </div>
        );
    }
  };

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'average_productivity':
        return value.toFixed(1);
      case 'current_streak':
        return `${value} day${value !== 1 ? 's' : ''}`;
      default:
        return value.toString();
    }
  };

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'total_tasks':
        return 'Total Tasks';
      case 'average_productivity':
        return 'Avg. Productivity';
      case 'current_streak':
        return 'Current Streak';
      default:
        return sort;
    }
  };

  const maskName = (name: string) => {
    const parts = name.split(' ');
    if (parts.length === 1) {
      return `${parts[0][0]}***`;
    }
    return `${parts[0]} ${parts[1][0]}.`;
  };

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Trophy className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Leaderboard
          </h2>
        </div>
        
        <div className="flex space-x-2">
          {['total_tasks', 'average_productivity', 'current_streak'].map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort as typeof sortBy)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors duration-200 ${
                sortBy === sort
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {getSortLabel(sort)}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No data available yet. Keep tracking tasks to see the leaderboard!
            </div>
          ) : (
            leaderboard.map((entry) => (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between p-4 rounded-lg transition-colors duration-200 ${
                  entry.user_id === user?.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {getRankIcon(entry.rank)}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {entry.user_id === user?.id ? entry.full_name : maskName(entry.full_name)}
                      {entry.user_id === user?.id && (
                        <span className="ml-2 text-xs bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Target className="h-4 w-4" />
                        <span>{entry.total_tasks} tasks</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4" />
                        <span>{entry.average_productivity.toFixed(1)} avg</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Award className="h-4 w-4" />
                        <span>{entry.current_streak} streak</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatValue(entry[sortBy], sortBy)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {getSortLabel(sortBy)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};