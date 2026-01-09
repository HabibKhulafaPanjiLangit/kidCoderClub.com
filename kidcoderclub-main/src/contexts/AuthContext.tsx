import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

type UserRole = 'admin' | 'mentor' | 'student';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  expertise: string | null;
  experience: string | null;
  bio: string | null;
  age: number | null;
  phone: string | null;
  approval_status: string | null;
  certificate_url: string | null;
}

interface SignUpData {
  fullName: string;
  role?: UserRole;
  expertise?: string;
  experience?: string;
  bio?: string;
  age?: number;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, data: SignUpData) => Promise<{ data: { user: User | null } | null; error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  isAdmin: boolean;
  isMentor: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileFetchedRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string) => {
    // Prevent duplicate fetches for the same user
    if (profileFetchedRef.current === userId) {
      return profile;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    profileFetchedRef.current = userId;
    return data as Profile | null;
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST (Supabase best practice)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Hanya fetch profile jika benar-benar diperlukan
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Reset dan fetch ulang untuk login baru atau token refresh
            profileFetchedRef.current = null;
            setTimeout(async () => {
              if (!mounted) return;
              const fetchedProfile = await fetchProfile(session.user.id);
              if (mounted) {
                setProfile(fetchedProfile);
                setLoading(false);
              }
            }, 0);
          } else if (event === 'INITIAL_SESSION') {
            // Untuk initial session, gunakan cached profile jika sudah ada
            if (profileFetchedRef.current === session.user.id && profile) {
              setLoading(false);
            } else {
              setTimeout(async () => {
                if (!mounted) return;
                const fetchedProfile = await fetchProfile(session.user.id);
                if (mounted) {
                  setProfile(fetchedProfile);
                  setLoading(false);
                }
              }, 0);
            }
          } else {
            // Event lain (USER_UPDATED, etc) - jangan reset loading
            setLoading(false);
          }
        } else {
          setProfile(null);
          profileFetchedRef.current = null;
          setLoading(false);
        }
      }
    );

    // Then check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      if (!session) {
        setLoading(false);
      }
      // Let onAuthStateChange handle the rest
    });

    // Handle visibility change - refresh token silently saat tab visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh session silently tanpa mengubah loading state
        supabase.auth.getSession();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [profile]);

  const signUp = async (email: string, password: string, data: SignUpData) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: data.fullName,
          role: data.role || 'student',
          expertise: data.expertise,
          experience: data.experience,
          bio: data.bio,
          age: data.age,
          phone: data.phone,
        },
      },
    });
    return { data: authData, error };
  };

  const signIn = async (email: string, password: string) => {
    // Reset profile fetch ref to allow fresh fetch
    profileFetchedRef.current = null;
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    profileFetchedRef.current = null;
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('User not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', user.id);

    if (!error) {
      // Refresh profile
      profileFetchedRef.current = null;
      const updatedProfile = await fetchProfile(user.id);
      setProfile(updatedProfile);
    }

    return { error };
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAdmin: profile?.role === 'admin',
    isMentor: profile?.role === 'mentor',
    isStudent: profile?.role === 'student',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
