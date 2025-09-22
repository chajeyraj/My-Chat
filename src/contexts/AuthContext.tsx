import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: any }>;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
  updatePassword: (password: string) => Promise<{ error?: any }>;
  updateEmail: (email: string) => Promise<{ error?: any }>;
  deleteAccount: () => Promise<{ error?: any }>;
  resetAccount: () => Promise<{ error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          // Ensure user exists in public.users table and update status
          if (session?.user) {
            setTimeout(async () => {
              await ensureUserExists(session.user);
              await updateUserStatus('online');
            }, 0);
          }
        }
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        setTimeout(async () => {
          await ensureUserExists(session.user);
          await updateUserStatus('online');
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureUserExists = async (authUser: any) => {
    try {
      // Check if user exists in public.users
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!existingUser) {
        // Create user in public.users table
        const { error } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            display_name: authUser.user_metadata?.display_name || null
          });

        if (error) {
          console.error('Error creating user profile:', error);
        }
      }
    } catch (error) {
      console.error('Error checking/creating user:', error);
    }
  };

  const updateUserStatus = async (status: 'online' | 'offline') => {
    if (!user) return;
    
    await supabase
      .from('users')
      .update({ status })
      .eq('id', user.id);
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Sign Up Failed",
          description: error.message
        });
        return { error };
      }
      
      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link."
      });
      
      return {};
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: "An unexpected error occurred"
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Sign In Failed",
          description: error.message
        });
        return { error };
      }
      
      return {};
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: "An unexpected error occurred"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      if (user) {
        await updateUserStatus('offline');
      }
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign Out Failed",
        description: "An unexpected error occurred"
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Password Reset Failed",
          description: error.message
        });
        return { error };
      }
      
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link."
      });
      
      return {};
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: "An unexpected error occurred"
      });
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Password Update Failed",
          description: error.message
        });
        return { error };
      }
      
      toast({
        title: "Password updated successfully"
      });
      
      return {};
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Password Update Failed",
        description: "An unexpected error occurred"
      });
      return { error };
    }
  };

  const updateEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        email
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Email Update Failed",
          description: error.message
        });
        return { error };
      }
      
      toast({
        title: "Check your new email",
        description: "We've sent you a confirmation link."
      });
      
      return {};
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Email Update Failed",
        description: "An unexpected error occurred"
      });
      return { error };
    }
  };

  const deleteAccount = async () => {
    try {
      // First delete user profile
      await supabase
        .from('users')
        .delete()
        .eq('id', user?.id);

      // Delete auth user (this will cascade delete messages due to foreign keys)
      const { error } = await supabase.auth.admin.deleteUser(user?.id || '');
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Account Deletion Failed",
          description: error.message
        });
        return { error };
      }
      
      toast({
        title: "Account deleted successfully"
      });
      
      return {};
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Account Deletion Failed",
        description: "An unexpected error occurred"
      });
      return { error };
    }
  };

  const resetAccount = async () => {
    try {
      if (!user) return { error: 'No user found' };
      
      // Delete all messages from/to this user
      await supabase
        .from('messages')
        .delete()
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      
      // Reset profile data (keep email and id)
      await supabase
        .from('users')
        .update({
          display_name: null,
          country: null,
          phone_number: null,
          profile_picture: null,
          profession: null
        })
        .eq('id', user.id);
      
      toast({
        title: "Account reset successfully",
        description: "Your chat history and profile have been cleared."
      });
      
      return {};
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Account Reset Failed",
        description: "An unexpected error occurred"
      });
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateEmail,
    deleteAccount,
    resetAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
