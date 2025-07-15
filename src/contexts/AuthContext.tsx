// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  companies: string[];
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  signUp: (email: string, password: string, fullName: string) => Promise<boolean>;
}

console.log('AuthContext.tsx: AuthContext defined');
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Initialize to true

  console.log('AuthContext.tsx: AuthProvider mounted. Initial loading state:', loading);

  useEffect(() => {
    console.log('AuthContext.tsx: useEffect started.');

    const handleAuthStateChange = async (event: string, session: any) => {
      console.log('AuthContext.tsx: handleAuthStateChange: Auth state change event:', event);
      if (session?.user) {
        console.log('AuthContext.tsx: handleAuthStateChange: Session user found, calling handleAuthUser.');
        await handleAuthUser(session.user);
      } else {
        console.log('AuthContext.tsx: handleAuthStateChange: No session user, setting states to unauthenticated.');
        setUser(null);
        setIsAuthenticated(false);
        // No setLoading(false) here, as initializeAuth or handleAuthUser's finally will handle it
        console.log('AuthContext.tsx: handleAuthStateChange: States set to unauthenticated.');
      }
    };

    const initializeAuth = async () => {
      console.log('AuthContext.tsx: initializeAuth: Starting initial session check.');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('AuthContext.tsx: initializeAuth: Initial session check completed. Session:', session);
        if (session?.user) {
          console.log('AuthContext.tsx: initializeAuth: Session user found. Processing user data.');
          await handleAuthUser(session.user);
          console.log('AuthContext.tsx: initializeAuth: handleAuthUser completed for initial session.');
        } else {
          console.log('AuthContext.tsx: initializeAuth: No initial session found.');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('AuthContext.tsx: initializeAuth: Error during initial session check:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false); // Always set loading to false after initial auth check
        console.log('AuthContext.tsx: setLoading(false) from initializeAuth finally block.');
      }

      // Listen for changes on auth state AFTER initial check is done
      const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
      console.log('AuthContext.tsx: onAuthStateChange subscription set up.');

      return () => {
        console.log('AuthContext.tsx: useEffect cleanup: Unsubscribing from onAuthStateChange.');
        subscription.unsubscribe();
      };
    };

    initializeAuth(); // Call the async initialization function

  }, []); // Empty dependency array means this runs once on mount

  const handleAuthUser = async (supabaseUser: SupabaseUser) => {
    console.log('AuthContext.tsx: handleAuthUser: Started for user ID:', supabaseUser.id);
    let profile: any = null; // Initialize profile to null
    try {
      // --- TEST: Fetch from a different table first ---
      console.log('AuthContext.tsx: handleAuthUser: Attempting to fetch companies to test client connection...');
      const { data: testCompanies, error: testError } = await supabase
        .from('companies')
        .select('id, name')
        .limit(1); // Just fetch one to confirm connection

      if (testError) {
        console.error('AuthContext.tsx: handleAuthUser: Test fetch from companies failed:', testError);
        // Don't throw yet, proceed to user_profiles fetch, but this is a strong indicator
      } else {
        console.log('AuthContext.tsx: handleAuthUser: Test fetch from companies successful. Companies found:', testCompanies?.length);
      }
      // --- END TEST ---


      // Attempt to fetch user profile
      console.log('AuthContext.tsx: handleAuthUser: Attempting to fetch user profile...');
      
      let fetchedProfileArray;
      let fetchError;

      try {
        console.log('AuthContext.tsx: handleAuthUser: Executing user_profiles select query...');
        const result = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', supabaseUser.id);
        
        fetchedProfileArray = result.data;
        fetchError = result.error;
        console.log('AuthContext.tsx: handleAuthUser: User profile select query completed.');

      } catch (e: any) {
        console.error('AuthContext.tsx: handleAuthUser: Caught synchronous error during user_profiles fetch:', e);
        fetchError = e; // Assign caught error
      }

      // Manually extract the profile from the array result
      const fetchedProfile = fetchedProfileArray && fetchedProfileArray.length > 0 ? fetchedProfileArray[0] : null;

      // --- START CRITICAL LOGGING ---
      console.log('AuthContext.tsx: Fetched profile data:', fetchedProfile);
      console.log('AuthContext.tsx: Fetch error object:', fetchError);
      // --- END CRITICAL LOGGING ---

      if (fetchError) {
        if (fetchError.code === 'PGRST116' || (fetchError.message && fetchError.message.includes('0 rows'))) { // Check for "0 rows" message as well
          console.warn('AuthContext.tsx: handleAuthUser: User profile not found, attempting to create one.');
          // Profile doesn't exist, create one
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: supabaseUser.id,
              full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
              avatar_url: supabaseUser.user_metadata?.avatar_url,
            })
            .select()
            .single(); // Keep .single() here as we expect one row on insert

          if (insertError) {
            console.error('AuthContext.tsx: handleAuthUser: Error creating profile:', insertError);
            throw insertError; // Throw error to be caught by outer catch block
          }
          profile = newProfile; // Assign newProfile to profile
          console.log('AuthContext.tsx: handleAuthUser: New profile created successfully:', profile);
        } else {
          console.error('AuthContext.tsx: handleAuthUser: Error fetching existing profile:', fetchError);
          // --- START ADDITIONAL ERROR LOGGING ---
          console.error('AuthContext.tsx: handleAuthUser: Full fetch error object:', fetchError);
          // --- END ADDITIONAL ERROR LOGGING ---
          throw fetchError; // Throw other errors to be caught by outer catch block
        }
      } else {
        profile = fetchedProfile; // Assign fetchedProfile to profile
        console.log('AuthContext.tsx: handleAuthUser: User profile fetched successfully:', profile);
      }

      // Ensure profile exists before proceeding
      if (!profile) {
        throw new Error('User profile could not be fetched or created.');
      }

      // Fetch user companies
      console.log('AuthContext.tsx: handleAuthUser: Attempting to fetch user companies...');
      const { data: userCompanies, error: userCompaniesError } = await supabase
        .from('users_companies')
        .select('company_id, role_id')
        .eq('user_id', supabaseUser.id)
        .eq('is_active', true);

      if (userCompaniesError) {
        console.error('AuthContext.tsx: handleAuthUser: Error fetching user companies:', userCompaniesError);
        throw userCompaniesError; // Throw error to be caught by outer catch block
      }
      console.log('AuthContext.tsx: handleAuthUser: User companies fetched successfully:', userCompanies);

      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: profile?.full_name || 'User',
        role: 'User', // Default role, adjust as needed
        permissions: ['dashboard'], // Default permissions, adjust as needed
        companies: userCompanies?.map(uc => uc.company_id) || [],
        avatar: profile?.avatar_url || undefined
      };

      console.log('AuthContext.tsx: handleAuthUser: Setting user and authentication states.');
      setUser(userData);
      setIsAuthenticated(true);
      console.log('AuthContext.tsx: handleAuthUser: User and isAuthenticated states updated.');

    } catch (error: any) {
      console.error('AuthContext.tsx: handleAuthUser: Caught an error during user data processing:', error);
      // Reset user and authentication states on error
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      // This finally block is now less critical for `loading` state, as `initializeAuth` handles it.
      // It's still good for ensuring `setUser` and `setIsAuthenticated` are reset on error.
      console.log('AuthContext.tsx: handleAuthUser: Finally block reached.');
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('AuthContext.tsx: login: Attempting login for email:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('AuthContext.tsx: login: Login error:', error);
        return false;
      }

      if (data.user) {
        console.log('AuthContext.tsx: login: User data received, calling handleAuthUser.');
        await handleAuthUser(data.user);
        return true;
      }
      console.log('AuthContext.tsx: login: No user data after signInWithPassword.');
      return false;
    } catch (error) {
      console.error('AuthContext.tsx: login: Unexpected login error:', error);
      return false;
    }
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<boolean> => {
    console.log('AuthContext.tsx: signUp: Attempting signup for email:', email);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('AuthContext.tsx: signUp: Sign up error:', error);
        return false;
      }

      // For signup, handleAuthUser might be called by onAuthStateChange 'SIGNED_IN' event
      // if auto-login happens after signup.
      console.log('AuthContext.tsx: signUp: Sign up successful, data:', data);
      return true;
    } catch (error) {
      console.error('AuthContext.tsx: signUp: Unexpected sign up error:', error);
      return false;
    }
  };

  const logout = async () => {
    console.log('AuthContext.tsx: logout: Attempting to sign out.');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext.tsx: logout: Logout error:', error);
      } else {
        console.log('AuthContext.tsx: logout: Signed out successfully.');
        // State will be reset by onAuthStateChange event
      }
    } catch (error) {
      console.error('AuthContext.tsx: logout: Unexpected logout error:', error);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    console.log('AuthContext.tsx: updateUser: Updating user data locally:', updates);
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    }
  };

  console.log('AuthContext.tsx: AuthProvider rendering. Current loading state:', loading);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, updateUser, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
