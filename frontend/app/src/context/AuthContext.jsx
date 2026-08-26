import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    const id = localStorage.getItem("user_id");

    if (token) {
      setUser({ token, username, role, id });
    }
  }, []);

  const loginUser = useCallback((userData) => {
    if (userData.token) localStorage.setItem("access_token", userData.token);
    if (userData.username) localStorage.setItem("username", userData.username);
    if (userData.role) localStorage.setItem("role", userData.role);
    if (userData.id) localStorage.setItem("user_id", userData.id);

    setUser(userData);
  }, []);

  const logoutUser = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};