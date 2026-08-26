// src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("access_token");
    const id = localStorage.getItem("user_id");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");
    const hasPreferences = localStorage.getItem("has_preferences") === "true";

    if (token && id) {
      return {
        token,
        id,
        username,
        role: role ? role.toUpperCase() : "",
        email,
        has_preferences: hasPreferences,
      };
    }
    return null;
  });

  const loginUser = useCallback((userData) => {
    const cleanRole = String(userData.role || "").toUpperCase();

    if (userData.token) localStorage.setItem("access_token", userData.token);
    if (userData.id) localStorage.setItem("user_id", String(userData.id));
    if (userData.username) localStorage.setItem("username", userData.username);
    if (cleanRole) localStorage.setItem("role", cleanRole);
    if (userData.email) localStorage.setItem("email", userData.email);
    localStorage.setItem(
      "has_preferences",
      String(Boolean(userData.has_preferences)),
    );

    setUser({
      ...userData,
      role: cleanRole,
      has_preferences: Boolean(userData.has_preferences),
    });
  }, []);

  const updateUserRoleState = useCallback((newRole) => {
    const cleanRole = String(newRole || "").toUpperCase();
    localStorage.setItem("role", cleanRole);

    setUser((prevUser) => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        role: cleanRole,
      };
    });
  }, []);

  const logoutUser = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("has_preferences");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user?.token,
        loginUser,
        updateUserRoleState,
        logoutUser,
      }}
    >
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
