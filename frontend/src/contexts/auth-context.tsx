import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUser = session?.user;

      if (supabaseUser) {
        setUser({ id: supabaseUser.id, email: supabaseUser.email! });
        setIsLoading(false);
      } else {
        // Auto-login with test credentials in development
        const isDevelopment = import.meta.env.VITE_APP_ENV === 'development';
        const testEmail = import.meta.env.VITE_TEST_USER_EMAIL;
        const testPassword = import.meta.env.VITE_TEST_USER_PASSWORD;

        if (isDevelopment && testEmail && testPassword) {
          console.log('Development mode: Auto-logging in with test user');
          const { data, error } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
          });

          if (error) {
            console.error('Failed to auto-login test user:', error);
          } else if (data.user) {
            setUser({ id: data.user.id, email: data.user.email! });
            console.log('Auto-logged in as test user:', data.user.email);
          }
        }
        setIsLoading(false);
      }

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

    initAuth().catch((error) => {
      console.error('Failed to initialize auth:', error);
      setIsLoading(false);
    });
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};