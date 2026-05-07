import React, { createContext, useContext, useState, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  const login = async (username, password) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    const stored = await AsyncStorage.getItem("crm_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.username === username && parsed.password === password) {
        setUser({ username });
        setIsAuthenticated(true);
        setIsLoading(false);
        return true;
      }
    }
    if (username.length >= 3 && password.length >= 6) {
      setUser({ username });
      setIsAuthenticated(true);
      await AsyncStorage.setItem("crm_user", JSON.stringify({ username, password }));
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const signup = async (username, password) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    if (username.length >= 3 && password.length >= 6) {
      await AsyncStorage.setItem("crm_user", JSON.stringify({ username, password }));
      setUser({ username });
      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, user, login, signup, logout }),
    [isAuthenticated, isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
