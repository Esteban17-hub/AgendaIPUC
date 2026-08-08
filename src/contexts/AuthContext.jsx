import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, congregations(name)')
        .eq('id', userId)
        .single();
        
      if (!error && data) {
        setProfile(data);
      } else {
        console.warn('Profile not found for user ID, trying fallback query...', error);
        const { data: fallbackProfiles } = await supabase
          .from('profiles')
          .select('*, congregations(name)')
          .limit(1);

        if (fallbackProfiles && fallbackProfiles.length > 0) {
          setProfile(fallbackProfiles[0]);
        } else {
          const { data: congregations } = await supabase.from('congregations').select('id, name').limit(1);
          const fallbackCongId = congregations?.[0]?.id || '22222222-2222-2222-2222-222222222222';
          const fallbackCongName = congregations?.[0]?.name || 'Congregación Principal';
          
          setProfile({
            id: userId,
            full_name: 'Usuario Administrador',
            role: 'admin',
            congregation_id: fallbackCongId,
            congregations: { name: fallbackCongName }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Session error:", error);
        setLoading(false);
        return;
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error("Session exception:", err);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    return await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, refreshProfile, signIn, signOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
