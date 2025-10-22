import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
  is2FARequired: boolean;
  mfaChallengeId: string | null;
  mfaFactorId: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any; userRole?: string }>; // Modified return type
  verifyMfaCode: (code: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);

  // Helper function to check and set user role with caching
  const checkAndSetUserRole = useCallback(async (currentUser: User | null) => {
    console.log('AuthContext: checkAndSetUserRole called with user:', currentUser?.id);
    if (currentUser) {
      try {
        // Check if we have cached role data
        const cachedRole = sessionStorage.getItem(`user_role_${currentUser.id}`);
        if (cachedRole) {
          console.log('AuthContext: Using cached role:', cachedRole);
          const isSuperAdminRole = cachedRole === 'superadmin';
          setIsSuperAdmin(isSuperAdminRole);
          console.log('AuthContext: isSuperAdmin set to', isSuperAdminRole, 'from cache');
          return cachedRole;
        }

        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        if (error) {
          console.error('AuthContext: Error fetching user role:', error);
          setIsSuperAdmin(false);
          console.log('AuthContext: isSuperAdmin set to false due to error.');
          return null; // Return null on error
        } else if (data && data.role) {
          // Cache the role for faster subsequent loads
          sessionStorage.setItem(`user_role_${currentUser.id}`, data.role);
          
          const isSuperAdminRole = data.role === 'superadmin';
          setIsSuperAdmin(isSuperAdminRole);
          console.log('AuthContext: isSuperAdmin set to', isSuperAdminRole, '. User role:', data.role);
          return data.role; // Return the role
        } else {
          setIsSuperAdmin(false);
          console.log('AuthContext: isSuperAdmin set to false. No role found.');
          return null;
        }
      } catch (error) {
        console.error('AuthContext: Unexpected error checking user role:', error);
        setIsSuperAdmin(false);
        return null;
      }
    } else {
      setIsSuperAdmin(false);
      console.log('AuthContext: isSuperAdmin set to false (no current user).');
      return null;
    }
  }, []);

  useEffect(() => {
    console.log('AuthContext: useEffect running.');
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext: Error getting session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          console.log('AuthContext: Initial session retrieved. User:', session?.user?.id);
          
          if (session?.user) {
            await checkAndSetUserRole(session.user);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed. Event:', event, 'Session:', session?.user?.id);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await checkAndSetUserRole(session.user);
          } else {
            setIsSuperAdmin(false);
            // Clear cached role data on sign out
            if (event === 'SIGNED_OUT') {
              sessionStorage.clear();
            }
          }
          
          // Reset 2FA state on auth change
          if (!session) {
            setIs2FARequired(false);
            setMfaChallengeId(null);
            setMfaFactorId(null);
            console.log('AuthContext: Session ended, 2FA state reset.');
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkAndSetUserRole]);

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext: signIn called.');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
        console.error('AuthContext: signIn error:', error);
        return { error };
      }

      let userRole: string | null = null;
      // Check if user has 2FA enabled and update role immediately after sign-in
      if (data.user) {
        console.log('AuthContext: User signed in. Checking role and 2FA.');
        userRole = await checkAndSetUserRole(data.user); // Ensure role is set immediately and capture it

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('requires_2fa') // Only fetch requires_2fa here, role is already handled
          .eq('id', data.user.id)
          .maybeSingle();

        if (userError) {
          console.error('AuthContext: Error checking 2FA status:', userError);
          return { error: null, userRole }; // Continue without 2FA check if query fails
        }

        // If 2FA is required, check for enrolled factors
        if (userData?.requires_2fa) {
          try {
            const { data: factors } = await supabase.auth.mfa.listFactors();
            
            if (factors?.totp && factors.totp.length > 0) {
              const factor = factors.totp[0];
              
              // Create MFA challenge
              const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: factor.id
              });

              if (challengeError) {
                console.error('AuthContext: MFA challenge error:', challengeError);
                return { error: challengeError, userRole };
              }

              // Set 2FA required state
              setIs2FARequired(true);
              setMfaChallengeId(challenge.id);
              setMfaFactorId(factor.id);
              console.log('AuthContext: 2FA required, challenge created.');
              
              // Don't set session yet - wait for 2FA verification
              return { error: null, userRole };
            }
          } catch (mfaError) {
            console.error('AuthContext: MFA setup error:', mfaError);
            // Continue without 2FA if there's an error
          }
        }
      }

      console.log('AuthContext: Sign-in process complete. Returning userRole:', userRole);
      return { error: null, userRole };
    } catch (error) {
      console.error('AuthContext: Unexpected error during signIn:', error);
      return { error, userRole: null };
    }
  };

  const verifyMfaCode = async (code: string) => {
    console.log('AuthContext: verifyMfaCode called.');
    if (!mfaChallengeId || !mfaFactorId) {
      return { error: new Error('No MFA challenge in progress') };
    }

    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: mfaChallengeId,
        code: code
      });

      if (error) {
        console.error('AuthContext: MFA verification error:', error);
        return { error };
      }

      // Update 2FA last used timestamp
      await supabase
        .from('user_2fa')
        .update({ last_used: new Date().toISOString() })
        .eq('user_id', data.user.id);

      // Clear 2FA state and update role immediately after MFA verification
      setIs2FARequired(false);
      setMfaChallengeId(null);
      setMfaFactorId(null);
      console.log('AuthContext: MFA verified. Checking role.');
      await checkAndSetUserRole(data.user); // Ensure role is set immediately after MFA

      console.log('AuthContext: MFA verification complete.');
      return { error: null };
    } catch (error) {
      console.error('AuthContext: Unexpected error during verifyMfaCode:', error);
      return { error };
    }
  };

  const signOut = async () => {
    console.log('AuthContext: signOut called.');
    await supabase.auth.signOut();
    setIs2FARequired(false);
    setMfaChallengeId(null);
    setMfaFactorId(null);
    setIsSuperAdmin(false);
    // Clear cached data
    sessionStorage.clear();
    console.log('AuthContext: User signed out. isSuperAdmin set to false.');
  };

  const value = {
    session,
    user,
    loading,
    isSuperAdmin,
    is2FARequired,
    mfaChallengeId,
    mfaFactorId,
    signIn,
    verifyMfaCode,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

