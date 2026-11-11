import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('wpg_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('wpg_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      const savedToken = localStorage.getItem('wpg_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.getMe();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('wpg_user', JSON.stringify(data.user));
        } else {
          logout();
        }
      } catch {
        // If server returns error or token expired, reset
        logout();
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });

    if (!data.success || !data.token) {
      throw new Error(data.error || 'Login failed. Please check your credentials.');
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('wpg_token', data.token);
    localStorage.setItem('wpg_user', JSON.stringify(data.user));

    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('wpg_token');
    localStorage.removeItem('wpg_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

