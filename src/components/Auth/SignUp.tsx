import React, { useState } from 'react';
import { Mail, Lock, User, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

interface SignUpProps {
  onToggleMode: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onToggleMode }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();

  const validateForm = () => {
    if (!fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      await signUp(email, password, fullName);
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BarChart3 className="h-10 w-10 text-primary-600 dark:text-primary-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Track Flow
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Get Started
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Focus Better. Work Smarter.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="relative">
              <User className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
              <Input
                label="Full Name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10"
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                placeholder="Enter your password"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
                placeholder="Confirm your password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={loading}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onToggleMode}
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200"
              >
                Sign in
              </button>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Please check your email and confirm the account verification, then return to the site and login.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
