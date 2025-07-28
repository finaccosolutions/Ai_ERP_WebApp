// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  mobile?: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  preferences?: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  isUserProcessing: boolean;
  userLoaded: boolean; // <--- NEW: Indicates user data is fully loaded and stable
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  signUp: (email: string, password: string, fullName: string, mobile: string) => Promise<boolean>;
  hasPermission: (module: string, action: string) => boolean;
}

console.log('AuthContext.tsx: AuthContext defined');
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Overall auth loading (session check, etc.)
  const isUserProcessing = useRef(false); // Ref to prevent concurrent profile fetches
  const [isUserProcessingState, setIsUserProcessingState] = useState(false); // State for external consumers
  const [userLoaded, setUserLoaded] = useState(false); // Indicates if detailed user data is loaded

  console.log('AuthContext.tsx: AuthProvider mounted. Initial loading state:');

  // Effect 1: Listen for Auth State Changes (login, logout, token refresh)
  useEffect(() => {
    setLoading(true); // Start overall auth loading
    setUserLoaded(false); // Reset userLoaded on any auth state change

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('AuthContext.tsx: onAuthStateChange triggered. Event:', _event, 'Session:', session);
      if (session?.user) {
        // Only set the basic user object here. Detailed profile fetch will be in another effect.
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || 'User', // Basic info from auth metadata
          role: '', // Will be filled by profile fetch
          role_id: '', // Will be filled by profile fetch
          permissions: {}, // Will be filled by profile fetch
          companies: [], // Will be filled by profile fetch
          avatar: session.user.user_metadata?.avatar_url || undefined,
          mobile: session.user.user_metadata?.phone || undefined,
          department: undefined,
          designation: undefined,
          employeeId: undefined,
          preferences: {},
        });
        setIsAuthenticated(true);
      } else {
        // If no session user, clear user and set states
        setUser(null);
        setIsAuthenticated(false);
        setUserLoaded(true); // If no user, then user data is "loaded" (as null)
      }
      setLoading(false); // Auth state is resolved
    });

    // Initial session check on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext.tsx: Initial getSession result:', session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || 'User',
          role: '',
          role_id: '',
          permissions: {},
          companies: [],
          avatar: session.user.user_metadata?.avatar_url || undefined,
          mobile: session.user.user_metadata?.phone || undefined,
          department: undefined,
          designation: undefined,
          employeeId: undefined,
          preferences: {},
        });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setUserLoaded(true); // No user, so no detailed data to load, consider it loaded.
      }
      setLoading(false); // Initial loading complete
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Effect 2: Fetch User Profile and Permissions (triggered when user.id changes)
  const fetchUserProfileAndPermissions = async () => {
    // Use the ref to prevent concurrent fetches
    if (!user?.id || isUserProcessing.current) {
      console.log('AuthContext.tsx: fetchUserProfileAndPermissions: Skipping fetch. User ID:', user?.id, 'Processing:', isUserProcessing.current);
      return;
    }

    isUserProcessing.current = true;
    setIsUserProcessingState(true); // State for external consumers
    setUserLoaded(false); // Indicate that detailed user data is being loaded

    try {
      console.log('AuthContext.tsx: fetchUserProfileAndPermissions: Fetching detailed profile for user ID:', user.id);
      
      // Fetch user profile
      const { data: fetchedProfileArray, error: fetchProfileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id);

      if (fetchProfileError) {
        console.error('AuthContext.tsx: fetchUserProfileAndPermissions: Error fetching user profile:', fetchProfileError);
        throw fetchProfileError;
      }
      const fetchedProfile = fetchedProfileArray && fetchedProfileArray.length > 0 ? fetchedProfileArray[0] : null;

      if (!fetchedProfile) {
        console.warn(`AuthContext.tsx: fetchUserProfileAndPermissions: User profile not found for user ID: ${user.id}.`);
        // If profile not found, we still mark userLoaded as true, but user object might be incomplete.
        // This scenario should ideally be handled during user creation/onboarding.
        setUserLoaded(true);
        return;
      }

      // Fetch user's company roles and permissions
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
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (userCompaniesError) {
        console.error('AuthContext.tsx: fetchUserProfileAndPermissions: Error fetching user companies:', userCompaniesError);
        throw userCompaniesError;
      }

      const userRole = userCompanies?.[0]?.user_roles;

      // Update the user state with detailed information
      setUser(prevUser => ({
        ...prevUser!, // Use non-null assertion as this effect only runs if user is not null
        name: fetchedProfile.full_name || prevUser!.name,
        role: userRole?.name || 'Standard User',
        role_id: userCompanies?.[0]?.role_id || '',
        permissions: userRole?.permissions || {},
        companies: userCompanies?.map(uc => uc.company_id) || [],
        avatar: fetchedProfile.avatar_url || prevUser!.avatar,
        mobile: fetchedProfile.phone || prevUser!.mobile,
        department: fetchedProfile.department || undefined,
        designation: fetchedProfile.designation || undefined,
        employeeId: fetchedProfile.employee_id || undefined,
        preferences: fetchedProfile.preferences || {},
      }));
      setUserLoaded(true); // Detailed user data is loaded
      console.log('AuthContext.tsx: fetchUserProfileAndPermissions completed. Detailed user data updated.');

    } catch (error: any) {
      console.error('AuthContext.tsx: fetchUserProfileAndPermissions: Caught an error during user data processing:', error);
      // On error, detailed data is not loaded, so keep userLoaded as false or handle appropriately
      setUserLoaded(false);
    } finally {
      isUserProcessing.current = false;
      setIsUserProcessingState(false);
    }
  };

  // This useEffect triggers the detailed profile fetch when user.id becomes available or changes
  useEffect(() => {
    if (user?.id) {
      fetchUserProfileAndPermissions();
    } else {
      // If user becomes null (e.g., logout), reset processing state
      isUserProcessing.current = false;
      setIsUserProcessingState(false);
      setUserLoaded(true); // No user, so no detailed data to load, consider it loaded.
    }
  }, [user?.id]); // Dependency on user.id

  // Effect 3: Handle visibility change to refresh session
  useEffect(() => {
    const handleVisibilityChange = async () => {
      console.log('AuthContext.tsx: handleVisibilityChange triggered. Document visibilityState:', document.visibilityState);
      if (document.visibilityState === 'visible') {
        console.log('AuthContext.tsx: Document became visible, attempting to refresh session.');
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('AuthContext.tsx: Error refreshing session on visibility change:', error);
        } else {
          console.log('AuthContext.tsx: Session refresh initiated on visibility change.');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setUserLoaded(false); // Reset userLoaded on login attempt
    console.log('AuthContext.tsx: login attempt for email:', email);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('AuthContext.tsx: login: Login error:', error);
        setLoading(false);
        return false;
      }
      console.log('AuthContext.tsx: login: Sign-in initiated. onAuthStateChange will handle state update.');
      return true;
    } catch (error) {
      console.error('AuthContext.tsx: login: Unexpected login error:', error);
      setLoading(false);
      return false;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, mobile: string): Promise<boolean> => {
    setLoading(true);
    setUserLoaded(false); // Reset userLoaded on signup attempt
    console.log('AuthContext.tsx: signUp: Attempting signup for email:', email);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: mobile,
          },
        },
      });

      if (error) {
        console.error('AuthContext.tsx: signUp: Sign up error:', error);
        setLoading(false);
        return false;
      }
      console.log('AuthContext.tsx: signUp: Sign-up initiated. onAuthStateChange will handle state update.');
      return true;
    } catch (error) {
      console.error('AuthContext.tsx: signUp: Unexpected sign up error:', error);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    console.log('AuthContext.tsx: logout: Attempting to sign out.');
    setLoading(true);
    setUserLoaded(false); // Reset userLoaded on logout
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext.tsx: logout: Logout error:', error);
      } else {
        console.log('AuthContext.tsx: logout: Signed out successfully.');
        // State will be cleared by onAuthStateChange listener
      }
    } catch (error) {
      console.error('AuthContext.tsx: logout: Unexpected logout error:', error);
    } finally {
      setLoading(false);
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
    return user.permissions[module]?.[action] === true;
  };

  console.log('AuthContext.tsx: AuthProvider rendering. Current loading state:', loading);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, isUserProcessing: isUserProcessingState, userLoaded, login, logout, updateUser, signUp, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

