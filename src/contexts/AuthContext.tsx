import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Defines the shape of the authentication context, including user, session, loading state,
// and authentication functions.
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

// Creates a React context for authentication, initialized as undefined.
// This context will provide auth state and functions to child components.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to consume the AuthContext.
// It provides an easy way for components to access authentication state and functions.
// Throws an error if used outside of an AuthProvider, ensuring context is available.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component that wraps the application and provides authentication context.
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // State for storing the authenticated user object.
  const [user, setUser] = useState<User | null>(null);

  // State for storing the user's session object.
  const [session, setSession] = useState<Session | null>(null);
  
  // State to track the initial loading of auth state.
  const [loading, setLoading] = useState(true);

  // Effect hook to handle Supabase authentication state changes.
  // It subscribes to auth events (SIGNED_IN, SIGNED_OUT, etc.) and updates the
  // user and session state accordingly.
  useEffect(() => {
    // Set up a listener for authentication state changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Fetches the current session on initial render to check if a user is already logged in.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup function to unsubscribe from the auth state change listener
    // when the component unmounts.
    return () => subscription.unsubscribe();
  }, []);

  // Function to handle user sign-up.
  // It uses Supabase's signUp method and includes a redirect URL for email confirmation.
  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });
    return { error };
  };

  // Function to handle user sign-in with email and password.
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  // Function to handle user sign-out.
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Function to handle password reset requests.
  // It sends a password reset email to the user with a link to the reset password page.
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/resetPassword`,
    });
    return { error };
  };

  // The value object provided to consumers of the AuthContext.
  // It includes the current auth state and all related functions.
  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  // Renders the AuthContext.Provider, making the auth state and functions
  // available to all descendant components.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
