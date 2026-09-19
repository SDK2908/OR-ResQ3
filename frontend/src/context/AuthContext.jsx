import React, { createContext, useContext, useState } from 'react';

/**
 * Mock Frontend-Only Authentication Context.
 * No backend auth endpoints or user credential stores are used or required.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState({
    id: 'USR-MOCK-01',
    name: 'Clinical Operations Director',
    role: 'OR_COORDINATOR',
    hospital: 'Metropolitan Surgical Center',
    isMock: true,
  });

  const login = (user) => setCurrentUser(user);
  const logout = () => setCurrentUser(null);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isMock: true }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
