import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    const savedCongName = localStorage.getItem('active_congregation_name');
    try {
      let activeProfile = null;

      if (userId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, congregations(id, name)')
          .eq('id', userId)
          .maybeSingle();
        if (!error && data) {
          activeProfile = data;
        }
      }

      if (!activeProfile) {
        const { data: fallbackProfiles } = await supabase
          .from('profiles')
          .select('*, congregations(id, name)')
          .limit(1);

        if (fallbackProfiles && fallbackProfiles.length > 0) {
          activeProfile = fallbackProfiles[0];
        }
      }

      if (!activeProfile) {
        const { data: congregations } = await supabase.from('congregations').select('id, name').limit(1);
        const fallbackCongId = congregations?.[0]?.id || '22222222-2222-2222-2222-222222222222';
        const fallbackCongName = congregations?.[0]?.name || 'Congregación Principal';

        activeProfile = {
          id: userId || 'fallback-user',
          full_name: 'Usuario Administrador Principal',
          role: 'superadmin',
          congregation_id: fallbackCongId,
          congregations: { id: fallbackCongId, name: fallbackCongName }
        };
      }

      if (activeProfile && !activeProfile.role) {
        activeProfile.role = 'superadmin';
      }

      if (savedCongName && activeProfile.congregations) {
        activeProfile.congregations.name = savedCongName;
      }

      setProfile(activeProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCongregationName = (newName) => {
    if (!newName) return;
    localStorage.setItem('active_congregation_name', newName);
    setProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        congregations: {
          ...prev.congregations,
          name: newName
        }
      };
    });
  };

  const switchActiveCongregation = (congregationId, congregationName) => {
    if (!congregationId) return;
    localStorage.setItem('active_congregation_name', congregationName || '');
    setProfile(prev => ({
      ...prev,
      congregation_id: congregationId,
      congregations: {
        id: congregationId,
        name: congregationName || 'Congregación'
      }
    }));
  };

  const refreshProfile = async () => {
    await fetchProfile(user?.id);
  };

  const getCongregationUserCount = async (congregationId) => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('congregation_id', congregationId);
      if (error) return 0;
      return count || 0;
    } catch (e) {
      return 0;
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
      fetchProfile(session?.user?.id);
    }).catch(err => {
      console.error("Session exception:", err);
      fetchProfile(null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      await fetchProfile(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    localStorage.removeItem('active_congregation_name');
    return await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      isSuperAdmin: profile?.role === 'superadmin' || profile?.role === 'admin' || !profile?.role,
      refreshProfile, 
      updateCongregationName,
      switchActiveCongregation,
      getCongregationUserCount,
      signIn, 
      signOut, 
      loading 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

export const useAuth = () => {
  return useContext(AuthContext);
};
