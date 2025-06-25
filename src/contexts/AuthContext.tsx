import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          await fetchUserProfile(session.user.id, session.user.email || '');
        } else if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        // If user doesn't exist, create profile
        if (error.code === 'PGRST116') {
          await createUserProfile(userId, email);
          return;
        }
        setUser(null);
        setLoading(false);
        return;
      }

      if (data) {
        setUser(data);
      } else {
        // User profile doesn't exist, create it
        await createUserProfile(userId, email);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const createUserProfile = async (userId: string, email: string) => {
    try {
      // Create user profile with email as full_name initially
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email,
            full_name: email.split('@')[0], // Use email username as initial full name
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        setUser(null);
        return;
      }

      // Initialize user stats
      await supabase
        .from('user_stats')
        .insert([
          {
            user_id: userId,
            total_tasks: 0,
            average_productivity: 0,
            current_streak: 0,
            longest_streak: 0,
            last_activity: new Date().toISOString(),
          },
        ]);

      setUser(data);
    } catch (error) {
      console.error('Error creating user profile:', error);
      setUser(null);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email,
            full_name: fullName,
          },
        ]);

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't throw error, let the auth state change handler create the profile
      }

      // Initialize user stats
      try {
        await supabase
          .from('user_stats')
          .insert([
            {
              user_id: data.user.id,
              total_tasks: 0,
              average_productivity: 0,
              current_streak: 0,
              longest_streak: 0,
              last_activity: new Date().toISOString(),
            },
          ]);
      } catch (statsError) {
        console.error('Error creating user stats:', statsError);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const value = {
    user,
    signUp,
    signIn,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};