import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  hebrewName: string | null;
  birthday: string | null;
  profileImageUrl: string | null;
}

function mapSupabaseUser(user: SupabaseUser | null): User | null {
  if (!user) return null;
  
  const metadata = user.user_metadata || {};
  
  return {
    id: user.id,
    email: user.email || null,
    firstName: metadata.first_name || metadata.full_name?.split(' ')[0] || null,
    lastName: metadata.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || null,
    hebrewName: metadata.hebrew_name || null,
    birthday: metadata.birthday || null,
    profileImageUrl: metadata.avatar_url || metadata.picture || null,
  };
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const user = mapSupabaseUser(session?.user || null);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error('Authentication not configured');
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      setSession(null);
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  const loginWithGoogle = async () => {
    if (!supabase) throw new Error('Authentication not configured');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const loginWithEmail = async (email: string, password: string) => {
    if (!supabase) throw new Error('Authentication not configured');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUpWithEmail = async (
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string,
    hebrewName?: string,
    birthday?: string
  ) => {
    if (!supabase) throw new Error('Authentication not configured');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          hebrew_name: hebrewName,
          birthday: birthday,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    if (!supabase) throw new Error('Authentication not configured');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  };

  const updateProfile = async (updates: { 
    firstName?: string; 
    lastName?: string; 
    hebrewName?: string; 
    birthday?: string; 
  }) => {
    if (!supabase) throw new Error('Authentication not configured');
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: updates.firstName,
        last_name: updates.lastName,
        hebrew_name: updates.hebrewName,
        birthday: updates.birthday,
      },
    });
    if (error) throw error;
  };

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
    isConfigured: isSupabaseConfigured(),
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    loginWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    resetPassword,
    updateProfile,
  };
}
