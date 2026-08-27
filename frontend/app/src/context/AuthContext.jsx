import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("access_token");
    const id = localStorage.getItem("user_id");

    if (token && id) {
      const storedIsActive = localStorage.getItem("is_active");
      const storedIsVerified = localStorage.getItem("is_verified");
      const storedHasPref = localStorage.getItem("has_preferences");

      return {
        token,
        id: Number(id),
        username: localStorage.getItem("username") || "",
        full_name: localStorage.getItem("full_name") || "",
        phone_number: localStorage.getItem("phone_number") || "",
        email: localStorage.getItem("email") || "",
        avatar: localStorage.getItem("avatar") || "",
        role: (localStorage.getItem("role") || "USER").toUpperCase(),
        is_active: storedIsActive !== null ? storedIsActive === "true" : true,
        is_verified: storedIsVerified !== null ? storedIsVerified === "true" : false,
        has_preferences: storedHasPref !== null ? storedHasPref === "true" : false,
      };
    }
    return null;
  });

  const loginUser = useCallback((userData) => {
    if (!userData) return;

    // Chuẩn hóa role và các trường dữ liệu
    const rawRole = String(userData.role || "USER");
    const cleanRole = rawRole.replace("RoleEnum.", "").toUpperCase();

    const token = userData.token || localStorage.getItem("access_token") || "";
    const id = userData.id || "";
    const username = userData.username || "";
    const fullName = userData.full_name || userData.username || "";
    const email = userData.email || "";
    const phoneNumber = userData.phone_number || "";
    const avatar = userData.avatar || "";
    const isActive = userData.is_active !== undefined ? Boolean(userData.is_active) : true;
    const isVerified = userData.is_verified !== undefined ? Boolean(userData.is_verified) : false;
    const hasPref = Boolean(userData.has_preferences);

    // Lưu vào localStorage
    if (token) localStorage.setItem("access_token", token);
    if (id) localStorage.setItem("user_id", String(id));
    localStorage.setItem("username", username);
    localStorage.setItem("full_name", fullName);
    localStorage.setItem("email", email);
    localStorage.setItem("phone_number", phoneNumber);
    localStorage.setItem("avatar", avatar);
    localStorage.setItem("role", cleanRole);
    localStorage.setItem("is_active", String(isActive));
    localStorage.setItem("is_verified", String(isVerified));
    localStorage.setItem("has_preferences", String(hasPref));

    // Cập nhật State
    setUser({
      token,
      id: Number(id),
      username,
      full_name: fullName,
      email,
      phone_number: phoneNumber,
      avatar,
      role: cleanRole,
      is_active: isActive,
      is_verified: isVerified,
      has_preferences: hasPref,
    });
  }, []);

  const logoutUser = useCallback(() => {
    localStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user?.token),
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};