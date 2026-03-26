import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on mount
    const savedUser  = localStorage.getItem('staff_user');
    const savedToken = localStorage.getItem('staff_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  /** Staff login via real backend */
  const login = async (username, password) => {
    const { data } = await authService.staffLogin({ username, password });
    if (data.success) {
      localStorage.setItem('staff_token', data.token);
      localStorage.setItem('staff_user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    }
    return { success: false, message: data.message || 'Login failed.' };
  };

  /** Admin login — stores token but redirects to /admin */
  const adminLogin = async (username, password) => {
    const { data } = await authService.adminLogin({ username, password });
    if (data.success) {
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    }
    return { success: false, message: data.message || 'Login failed.' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, adminLogin, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
