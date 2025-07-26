// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  role: string; // Name of the role
  role_id: string; // ID of the role
  permissions: any; // JSONB object of permissions
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
  hasPermission: (module: string, action: string) => boolean; // New permission checker
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
      setLoading(false); // Ensure loading is false after state change is processed
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

    // Add visibility change listener for session refresh
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('AuthContext.tsx: Document became visible, attempting to refresh session.');
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('AuthContext.tsx: Error refreshing session on visibility change:', error);
        } else if (data.session) {
          console.log('AuthContext.tsx: Session refreshed successfully on visibility change.');
          // Re-process user data if session changed
          if (data.user && (!user || user.id !== data.user.id)) {
            await handleAuthUser(data.user);
          }
        } else {
          console.log('AuthContext.tsx: No session returned after refresh on visibility change.');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

  }, []);

  const handleAuthUser = async (supabaseUser: SupabaseUser) => {
    console.log('AuthContext.tsx: handleAuthUser: Started for user ID:', supabaseUser.id);
    let profile: any = null;
    let userRole: any = null;

    try {
      // Attempt to fetch user profile once
      console.log(`AuthContext.tsx: handleAuthUser: Attempting to query user_profiles table for user: ${supabaseUser.id}`);
      const { data: fetchedProfileArray, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', supabaseUser.id);

      console.log('AuthContext.tsx: handleAuthUser: User profile select query completed.');
      console.log('AuthContext.tsx: handleAuthUser: User profile select query result data:', fetchedProfileArray);
      console.log('AuthContext.tsx: handleAuthUser: User profile select query result error:', fetchError);

      const fetchedProfile = fetchedProfileArray && fetchedProfileArray.length > 0 ? fetchedProfileArray[0] : null;

      if (!fetchedProfile) {
        // If no profile found, it means the user is not fully set up or the profile hasn't been created yet.
        // In this case, we treat them as unauthenticated for now to show the login page quickly.
        console.warn(`AuthContext.tsx: handleAuthUser: User profile not found for user ID: ${supabaseUser.id}. Setting as unauthenticated.`);
        setUser(null);
        setIsAuthenticated(false);
        return; // Exit early
      }

      profile = fetchedProfile;
      console.log('AuthContext.tsx: handleAuthUser: User profile fetched successfully:', profile);

      console.log('AuthContext.tsx: handleAuthUser: Attempting to fetch user companies and roles...');
      const { data: userCompanies, error: userCompaniesError } = await supabase
        .from('users_companies')
        .select(`
          company_id,
          role_id,
          user_roles (
            name,
            permissions
          )
        `)
        .eq('user_id', supabaseUser.id)
        .eq('is_active', true);

      if (userCompaniesError) {
        console.error('AuthContext.tsx: handleAuthUser: Error fetching user companies:', userCompaniesError);
        throw userCompaniesError;
      }
      console.log('AuthContext.tsx: handleAuthUser: User companies fetched successfully:', userCompanies);

      // For simplicity, we'll take the role from the first company if multiple exist
      // A more complex app might handle roles per company or aggregate permissions
      if (userCompanies && userCompanies.length > 0) {
        userRole = userCompanies[0].user_roles;
      }

      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: profile?.full_name || 'User',
        role: userRole?.name || 'Standard User', // Default role name
        role_id: userCompanies?.[0]?.role_id || '', // Default role ID
        permissions: userRole?.permissions || {}, // Default empty permissions
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
      // Do not re-throw here, as it's caught by initializeAuth or handleAuthStateChange
    } finally {
      console.log('AuthContext.tsx: handleAuthUser: Finally block reached.');
      setLoading(false); // Ensure loading is false after processing
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
    } finally {
      setLoading(false); // Ensure loading is false after logout
    }
  };

  const updateUser = (updates: Partial<User>) => {
    console.log('AuthContext.tsx: updateUser: Updating user data locally:', updates);
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    }
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!user || !user.permissions) {
      return false;
    }
    // Check if the module exists and if the action is explicitly true
    return user.permissions[module]?.[action] === true;
  };

  console.log('AuthContext.tsx: AuthProvider rendering. Current loading state:', loading);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, updateUser, signUp, hasPermission }}>
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

