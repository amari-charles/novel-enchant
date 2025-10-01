import React, { createContext, useContext, useState, useEffect } from 'react';

// Check if Supabase credentials are available
const hasSupabaseCredentials = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return url && key && url !== 'your-supabase-project-url' && key !== 'your-supabase-anon-key';
};

// Mock user type for when Supabase isn't available
interface MockUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: MockUser | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we're in development/test mode
    const isDevelopment = import.meta.env.VITE_APP_ENV === 'development';

    if (isDevelopment) {
      // In development, use a mock user without requiring Supabase authentication
      console.log('Development mode: Using mock authenticated user');

      // Use a consistent dev user ID that matches our RLS policies
      const devUser: MockUser = {
        id: '00000000-0000-0000-0000-000000000123',
        email: 'dev@test.com'
      };

      setUser(devUser);
      console.log('Mock user set for development:', devUser.email);
      setIsLoading(false);

    } else if (hasSupabaseCredentials()) {
      // Use real Supabase auth in production
      const initSupabaseAuth = async () => {
        const { supabase } = await import('../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        const supabaseUser = session?.user;
        if (supabaseUser) {
          setUser({ id: supabaseUser.id, email: supabaseUser.email! });
        }
        setIsLoading(false);

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            const supabaseUser = session?.user;
            if (supabaseUser) {
              setUser({ id: supabaseUser.id, email: supabaseUser.email! });
            } else {
              setUser(null);
            }
            setIsLoading(false);
          }
        );

        return () => subscription.unsubscribe();
      };

      initSupabaseAuth().catch((error) => {
        console.error('Failed to initialize Supabase auth:', error);
        setIsLoading(false);
      });
    } else {
      // Fallback to mock auth if no credentials in production
      console.log('Using mock authentication (Supabase credentials not configured)');
      const devUser: MockUser = {
        id: '00000000-0000-0000-0000-000000000123',
        email: 'dev@test.com'
      };
      setUser(devUser);
      console.log('Auto-logged in as dev user:', devUser.email);
      setIsLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string) => {
    const isDevelopment = import.meta.env.VITE_APP_ENV === 'development';

    if (isDevelopment) {
      // In development, just use the dev user
      const devUser: MockUser = { id: '00000000-0000-0000-0000-000000000123', email: 'dev@test.com' };
      setUser(devUser);
      return { error: null };
    } else if (hasSupabaseCredentials()) {
      try {
        const { supabase } = await import('../lib/supabase');
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        return { error };
      } catch (error) {
        return { error: error as Error };
      }
    } else {
      // Mock signup - use consistent dev user
      const devUser: MockUser = { id: '00000000-0000-0000-0000-000000000123', email: 'dev@test.com' };
      setUser(devUser);
      return { error: null };
    }
  };

  const signIn = async (email: string, password: string) => {
    const isDevelopment = import.meta.env.VITE_APP_ENV === 'development';

    if (isDevelopment) {
      // In development, just use the dev user
      const devUser: MockUser = { id: '00000000-0000-0000-0000-000000000123', email: 'dev@test.com' };
      setUser(devUser);
      return { error: null };
    } else if (hasSupabaseCredentials()) {
      try {
        const { supabase } = await import('../lib/supabase');
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        return { error };
      } catch (error) {
        return { error: error as Error };
      }
    } else {
      // Mock signin - use consistent dev user
      const devUser: MockUser = { id: '00000000-0000-0000-0000-000000000123', email: 'dev@test.com' };
      setUser(devUser);
      return { error: null };
    }
  };

  const signOut = async () => {
    const isDevelopment = import.meta.env.VITE_APP_ENV === 'development';

    if (isDevelopment) {
      // In development, don't actually sign out - keep test user
      console.log('Development mode: Keeping test user logged in');
      return;
    } else if (hasSupabaseCredentials()) {
      const { supabase } = await import('../lib/supabase');
      await supabase.auth.signOut();
    } else {
      // Mock signout
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};