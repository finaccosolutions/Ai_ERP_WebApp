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
  mobile?: string; // Add mobile to User interface
  department?: string; // Added for ProfilePage
  designation?: string; // Added for ProfilePage
  employeeId?: string; // Added for ProfilePage
  preferences?: any; // Added for SettingsPage and AIPreferencesPage
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  signUp: (email: string, password: string, fullName: string, mobile: string) => Promise<boolean>;
}

console.log('AuthContext.tsx: AuthContext defined');
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  console.log('AuthContext.tsx: AuthProvider mounted. Initial loading state:', loading);

  useEffect(() => {
    console.log('AuthContext.tsx: useEffect started.');

    const handleAuthStateChange = async (event: string, session: any) => {
      console.log('AuthContext.tsx: handleAuthStateChange: Auth state change event:', event);
      if (session?.user) {
        // Add a check to prevent redundant calls if user is already set and matches
        if (user && user.id === session.user.id) {
          console.log('AuthContext.tsx: handleAuthStateChange: User already set, skipping handleAuthUser.');
          return;
        }
        console.log('AuthContext.tsx: handleAuthStateChange: Session user found, calling handleAuthUser.');
        await handleAuthUser(session.user);
      } else {
        console.log('AuthContext.tsx: handleAuthStateChange: No session user, setting states to unauthenticated.');
        setUser(null);
        setIsAuthenticated(false);
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
          console.log('AuthContext.tsx: handleAuthUser completed for initial session.');
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
        setLoading(false);
        console.log('AuthContext.tsx: setLoading(false) from initializeAuth finally block.');
      }

      const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(handleAuthStateChange);
      console.log('AuthContext.tsx: onAuthStateChange subscription set up.');

      return () => {
        console.log('AuthContext.tsx: useEffect cleanup: Unsubscribing from onAuthStateChange.');
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    };

    initializeAuth();

  }, []);

  const handleAuthUser = async (supabaseUser: SupabaseUser) => {
    console.log('AuthContext.tsx: handleAuthUser: Started for user ID:', supabaseUser.id);
    let profile: any = null;
    const maxRetries = 30;
    const retryDelayMs = 500;

    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Initial delay

      for (let i = 0; i < maxRetries; i++) {
        console.log(`AuthContext.tsx: handleAuthUser: Attempt ${i + 1} to query user_profiles table...`);
        const { data: fetchedProfileArray, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', supabaseUser.id);

        console.log('AuthContext.tsx: handleAuthUser: User profile select query completed.');
        console.log('AuthContext.tsx: handleAuthUser: User profile select query result data:', fetchedProfileArray);
        console.log('AuthContext.tsx: handleAuthUser: User profile select query result error:', fetchError);

        const fetchedProfile = fetchedProfileArray && fetchedProfileArray.length > 0 ? fetchedProfileArray[0] : null;

        if (fetchedProfile) {
          profile = fetchedProfile;
          console.log('AuthContext.tsx: handleAuthUser: User profile fetched successfully:', profile);
          break;
        } else if (fetchError) {
          console.error(`AuthContext.tsx: handleAuthUser: Error fetching user profile on attempt ${i + 1}:`, fetchError);
        } else {
          console.warn(`AuthContext.tsx: handleAuthUser: User profile not found on attempt ${i + 1}. Retrying...`);
        }

        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        }
      }

      if (!profile) {
        throw new Error('User profile could not be fetched after multiple attempts. It might not have been created by the trigger yet, or there was a persistent error.');
      }

      console.log('AuthContext.tsx: handleAuthUser: Attempting to fetch user companies...');
      const { data: userCompanies, error: userCompaniesError } = await supabase
        .from('users_companies')
        .select('company_id, role_id')
        .eq('user_id', supabaseUser.id)
        .eq('is_active', true);

      if (userCompaniesError) {
        console.error('AuthContext.tsx: handleAuthUser: Error fetching user companies:', userCompaniesError);
        throw userCompaniesError;
      }
      console.log('AuthContext.tsx: handleAuthUser: User companies fetched successfully:', userCompanies);

      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: profile?.full_name || 'User',
        role: 'User',
        permissions: ['dashboard'],
        companies: userCompanies?.map(uc => uc.company_id) || [],
        avatar: profile?.avatar_url || undefined,
        mobile: profile?.phone || undefined, // Include mobile number from profile
        department: profile?.department || undefined, // Include department
        designation: profile?.designation || undefined, // Include designation
        employeeId: profile?.employee_id || undefined, // Include employeeId
        preferences: profile?.preferences || {}, // Include preferences
      };

      console.log('AuthContext.tsx: handleAuthUser: Setting user and authentication states.');
      setUser(userData);
      setIsAuthenticated(true);
      console.log('AuthContext.tsx: handleAuthUser: User and isAuthenticated states updated.');

    } catch (error: any) {
      console.error('AuthContext.tsx: handleAuthUser: Caught an error during user data processing:', error);
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      console.log('AuthContext.tsx: handleAuthUser: Finally block reached.');
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('AuthContext.tsx: login: Attempting login for email:', email);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('AuthContext.tsx: login: Login error:', error);
        return false;
      }
      // Do NOT call handleAuthUser here. Let onAuthStateChange handle it.
      console.log('AuthContext.tsx: login: Sign-in initiated. Waiting for onAuthStateChange.');
      return true;
    } catch (error) {
      console.error('AuthContext.tsx: login: Unexpected login error:', error);
      return false;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, mobile: string): Promise<boolean> => {
    console.log('AuthContext.tsx: signUp: Attempting signup for email:', email);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: mobile, // Pass mobile number here
          },
        },
      });

      if (error) {
        console.error('AuthContext.tsx: signUp: Sign up error:', error);
        return false;
      }
      // Do NOT call handleAuthUser here. Let onAuthStateChange handle it.
      console.log('AuthContext.tsx: signUp: Sign-up initiated. Waiting for onAuthStateChange.');
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
        // Manually clear user state after successful logout
        setUser(null);
        setIsAuthenticated(false);
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
