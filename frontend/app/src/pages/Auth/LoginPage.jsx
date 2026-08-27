// src/pages/Auth/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthInput from "../../components/Auth/AuthInput";
import AuthButton from "../../components/Auth/AuthButton";
import AuthGoogleButton from "../../components/Auth/AuthGoogleButton";
import RoleSelectionModal from "../../components/Auth/RoleSelectionModal";
import authServices from "../../services/authServices";
import { useAuth } from "../../context/AuthContext";
import { isPendingRole } from "../../utils/authHelper";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [tempAuthData, setTempAuthData] = useState(null);

  const routeByRoleAndPreferences = (role, hasPreferences) => {
    const cleanRole = String(role || "").toUpperCase();
    if (cleanRole === "STAFF" || cleanRole === "ADMIN") {
      navigate("/dashboard/organizer");
    } else if (cleanRole === "USER") {
      if (!hasPreferences) {
        navigate("/select-preferences");
      } else {
        navigate("/");
      }
    } else {
      navigate("/");
    }
  };

  const handleLoginSuccess = (resPayload) => {
    console.log("Payload nhận được từ Login:", resPayload);
    const rawUser = resPayload.data || resPayload.user || resPayload;

    if (!rawUser) {
      throw new Error("Không tìm thấy thông tin tài khoản hợp lệ từ máy chủ!");
    }

    const rawRole = rawUser.role;
    const tokenValue =
      resPayload.access_token ||
      rawUser.access_token ||
      rawUser.token ||
      "authenticated_session";

    const hasPreferences = Boolean(
      rawUser.has_preferences ?? !resPayload.needs_setup_preferences,
    );

    const authData = {
      token: tokenValue,
      id: String(rawUser.id || ""),
      username: rawUser.username || "",
      role: rawRole,
      email: rawUser.email || "",
      avatar: rawUser.avatar || "",
      full_name: rawUser.full_name || "",
      has_preferences: hasPreferences,
    };

    // KIỂM TRA ROLE PENDING ĐỂ MỞ MODAL
    if (isPendingRole(rawRole)) {
      console.log("Tài khoản PENDING -> Kích hoạt Modal chọn role");
      setTempAuthData(authData);
      setShowRoleModal(true);
      return;
    }

    loginUser(authData);
    routeByRoleAndPreferences(rawRole, hasPreferences);
  };

  const handleSelectRole = async (selectedRole) => {
    try {
      setLoading(true);
      setErrorMsg("");

      if (authServices.updateRole) {
        await authServices.updateRole({ role: selectedRole.toLowerCase() });
      }

      const updatedAuthData = {
        ...tempAuthData,
        role: selectedRole,
      };

      loginUser(updatedAuthData);
      setShowRoleModal(false);
      routeByRoleAndPreferences(selectedRole, updatedAuthData.has_preferences);
    } catch (err) {
      console.error("Lỗi khi chọn role:", err);
      setErrorMsg("Không thể cập nhật loại tài khoản. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")?.trim();
    const password = formData.get("password");

    if (!email || !password) {
      setErrorMsg("Vui lòng điền đầy đủ email và mật khẩu!");
      return;
    }

    try {
      setLoading(true);
      const response = await authServices.login({ email, password });
      const resPayload = response.data !== undefined ? response.data : response;
      handleLoginSuccess(resPayload);
    } catch (err) {
      console.error("Login error:", err);
      const message =
        err.response?.data?.message ||
        err.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản, mật khẩu!";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
  try {
    setErrorMsg("");
    setLoading(true);

    const response = await authServices.googleLogin();
    console.log("Response từ server:", response);

    // Lấy link xác thực từ cấu trúc NewPackage (response.data.auth_url)
    const authUrl =
      response?.data?.auth_url ||
      response?.auth_url ||
      response?.data?.url ||
      response?.url;

    if (!authUrl) {
      throw new Error("Không nhận được đường dẫn xác thực Google từ máy chủ!");
    }

    // Chuyển hướng người dùng sang trang đăng nhập của Google
    window.location.href = authUrl;
  } catch (error) {
    console.error("Google login error:", error);
    setErrorMsg(
      error.response?.data?.message ||
        error.message ||
        "Đăng nhập Google thất bại. Vui lòng thử lại sau!"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#0D0D0D] px-6 py-12">
      <section className="w-full max-w-[440px] rounded-2xl border border-[#2A2A2A] bg-[#F4F1EB] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.45)] sm:p-10">
        <header className="mb-8">
          <span className="text-[10px] font-bold tracking-[4px] text-[#171717]">
            HOKIHUVA EVENTS
          </span>
          <h1 className="mt-3 text-[34px] font-extrabold tracking-[-1.5px] text-[#E85B2A]">
            Đăng nhập
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#5F5C57]">
            Chào mừng bạn quay trở lại. Đăng nhập để tiếp tục.
          </p>
        </header>

        {errorMsg && (
          <div className="mb-5 rounded-lg border border-red-300 bg-red-100 p-3 text-xs font-semibold text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <AuthInput
            label="EMAIL"
            name="email"
            type="email"
            placeholder="your@email.com"
            required
          />

          <AuthInput
            label="MẬT KHẨU"
            name="password"
            type="password"
            placeholder="••••••••"
            required
          />

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-[#E85B2A] hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <AuthButton type="submit" disabled={loading}>
            {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP"}
          </AuthButton>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-[1px] flex-1 bg-[#D5D0C7]" />
          <span className="text-[11px] font-semibold text-[#8C8881]">HOẶC</span>
          <div className="h-[1px] flex-1 bg-[#D5D0C7]" />
        </div>

        <AuthGoogleButton onClick={handleGoogleLogin} disabled={loading} />

        <footer className="mt-7 text-center text-xs text-[#5F5C57]">
          Chưa có tài khoản?
          <Link
            to="/register"
            className="ml-2 font-bold text-[#E85B2A] hover:underline"
          >
            ĐĂNG KÝ
          </Link>
        </footer>
      </section>

      {/* Component Modal chọn role */}
      <RoleSelectionModal
        isOpen={showRoleModal}
        onSelectRole={handleSelectRole}
        loading={loading}
      />
    </main>
  );
}