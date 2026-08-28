import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthInput from "../../components/Auth/AuthInput";
import AuthButton from "../../components/Auth/AuthButton";
import AuthGoogleButton from "../../components/Auth/AuthGoogleButton";
import RoleSelectionModal from "../../components/Auth/RoleSelectionModal";
import PreferenceModal from "../../components/User/PreferenceModal";
import GlobalLoadingOverlay from "../../components/Common/GlobalLoadingOverlay";

import authServices from "../../services/authServices";
import companyServices from "../../services/companyServices";
import { useAuth } from "../../context/AuthContext";
import { useCategories } from "../../hooks/useCategories";
import { isPendingRole } from "../../utils/authHelper";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const { categories, loading: categoriesLoading } = useCategories();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Loading Overlay State
  const [isOverlayLoading, setIsOverlayLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Đang đăng nhập...");

  // Role Selection Modal State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [tempAuthData, setTempAuthData] = useState(null);

  // Preference Modal State (Cho USER nếu thiếu)
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  // Lọc bỏ danh mục "Tất cả" (id: null)
  const validCategories = (categories || []).filter((cat) => cat.id !== null);

  const routeByRoleAndStatus = async (authData) => {
    const cleanRole = String(authData.role || "")
      .toUpperCase()
      .replace("ROLEENUM.", "")
      .trim();

    const hasPreferences =
      authData.has_preferences === true ||
      authData.has_preferences === "true" ||
      authData.has_preferences === 1;

    let hasCompany =
      authData.has_company === true ||
      authData.has_company === "true" ||
      authData.has_company === 1;

    // 1. NHÓM QUẢN TRỊ / BAN TỔ CHỨC (STAFF / ORGANIZER / ADMIN)
    if (cleanRole === "STAFF" || cleanRole === "ORGANIZER") {
      // Kiểm tra thực tế xem đã có hồ sơ công ty chưa nếu cờ has_company chưa rõ
      if (!hasCompany && authData.id) {
        try {
          const compRes = await companyServices.getCompanyByUserId(authData.id);
          if (compRes?.data?.id) {
            hasCompany = true;
          }
        } catch (err) {
          console.warn("Chưa có thông tin công ty:", err);
        }
      }

      const updatedData = { ...authData, has_company: hasCompany };
      loginUser(updatedData);

      // Nếu chưa có công ty -> vào trang đăng ký công ty, ngược lại vào Profile/Dashboard
      navigate(hasCompany ? "/profile" : "/register-company", { replace: true });
      return;
    }

    if (cleanRole === "ADMIN") {
      loginUser(authData);
      navigate("/profile", { replace: true });
      return;
    }

    // 2. NHÓM NGƯỜI DÙNG THÔNG THƯỜNG (USER)
    if (cleanRole === "USER" || cleanRole === "") {
      if (!hasPreferences) {
        setTempAuthData(authData);
        setShowPrefModal(true); // Mở Modal chọn sở thích
        return;
      }

      loginUser(authData);
      navigate("/", { replace: true });
      return;
    }

    loginUser(authData);
    navigate("/", { replace: true });
  };

  const handleLoginSuccess = async (resPayload) => {
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

    if (tokenValue) {
      localStorage.setItem("access_token", tokenValue);
    }

    const hasPreferences = Boolean(
      rawUser.has_preferences ?? !resPayload.needs_setup_preferences
    );
    const hasCompany = Boolean(rawUser.has_company);

    const authData = {
      token: tokenValue,
      id: Number(rawUser.id) || rawUser.id,
      username: rawUser.username || "",
      role: rawRole,
      email: rawUser.email || "",
      avatar: rawUser.avatar || "",
      full_name: rawUser.full_name || rawUser.username || "",
      phone_number: rawUser.phone_number || "",
      is_active: rawUser.is_active !== undefined ? Boolean(rawUser.is_active) : true,
      is_verified: rawUser.is_verified !== undefined ? Boolean(rawUser.is_verified) : false,
      has_preferences: hasPreferences,
      has_company: hasCompany,
    };

    // Tài khoản mới chưa chọn Role
    if (isPendingRole(rawRole)) {
      setTempAuthData(authData);
      setShowRoleModal(true);
      return;
    }

    await routeByRoleAndStatus(authData);
  };

  const handleSelectRole = async (selectedRole) => {
    try {
      setLoading(true);
      setErrorMsg("");

      const cleanSelectedRole = selectedRole.toUpperCase();

      if (authServices.updateRole) {
        await authServices.updateRole({
          userId: tempAuthData?.id,
          role: cleanSelectedRole,
        });
      }

      const updatedAuthData = {
        ...tempAuthData,
        role: cleanSelectedRole,
      };

      setShowRoleModal(false);
      await routeByRoleAndStatus(updatedAuthData);
    } catch (err) {
      console.error("Lỗi khi chọn role:", err);
      setErrorMsg("Không thể cập nhật vai trò tài khoản. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategory = (id) => {
    const numId = Number(id);
    setSelectedCategoryIds((prev) =>
      prev.includes(numId) ? prev.filter((item) => item !== numId) : [...prev, numId]
    );
  };

  const handleSavePreferences = async () => {
    if (selectedCategoryIds.length === 0) {
      alert("Vui lòng chọn ít nhất 1 thể loại yêu thích!");
      return;
    }

    try {
      setLoading(true);

      if (authServices.updatePreferences) {
        await authServices.updatePreferences({
          userId: tempAuthData?.id,
          categoryIds: selectedCategoryIds,
        });
      }

      const finalAuthData = {
        ...tempAuthData,
        has_preferences: true,
      };

      loginUser(finalAuthData);
      setShowPrefModal(false);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Lỗi khi lưu preferences:", err);
      setErrorMsg("Không thể lưu sở thích lúc này. Vui lòng thử lại!");
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

    setIsOverlayLoading(true);
    setLoadingProgress(20);
    setLoadingMessage("Đang xác thực thông tin tài khoản...");

    const timer = setInterval(() => {
      setLoadingProgress((prev) => (prev >= 85 ? 85 : prev + 20));
    }, 80);

    try {
      setLoading(true);
      const response = await authServices.login({ email, password });
      const resPayload = response.data !== undefined ? response.data : response;

      clearInterval(timer);
      setLoadingProgress(100);

      setTimeout(async () => {
        setIsOverlayLoading(false);
        setLoadingProgress(0);
        await handleLoginSuccess(resPayload);
      }, 250);
    } catch (err) {
      clearInterval(timer);
      setIsOverlayLoading(false);
      setLoadingProgress(0);
      console.error("Login error:", err);
      setErrorMsg(
        err.response?.data?.message ||
          err.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg("");
      setIsOverlayLoading(true);
      setLoadingProgress(30);
      setLoadingMessage("Đang chuyển hướng tới Google...");

      const response = await authServices.googleLogin();
      const authUrl =
        response?.data?.auth_url ||
        response?.auth_url ||
        response?.data?.url ||
        response?.url;

      if (!authUrl) {
        throw new Error("Không nhận được đường dẫn xác thực Google từ máy chủ!");
      }

      setLoadingProgress(100);
      window.location.href = authUrl;
    } catch (error) {
      setIsOverlayLoading(false);
      setLoadingProgress(0);
      console.error("Google login error:", error);
      setErrorMsg(
        error.response?.data?.message ||
          error.message ||
          "Đăng nhập Google thất bại. Vui lòng thử lại sau!"
      );
    }
  };

  return (
    <>
      <GlobalLoadingOverlay
        isLoading={isOverlayLoading}
        progress={loadingProgress}
        title={loadingMessage}
        description="Vui lòng chờ trong giây lát"
      />

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
              ⚠️ {errorMsg}
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

        {/* Modal 1: Chọn vai trò */}
        <RoleSelectionModal
          isOpen={showRoleModal}
          onSelectRole={handleSelectRole}
          loading={loading}
        />
    
        {/* Modal 2: Bắt buộc chọn sở thích cho USER */}
        <PreferenceModal
          isOpen={showPrefModal}
          categories={validCategories}
          selectedIds={selectedCategoryIds}
          onToggleCategory={handleToggleCategory}
          onSave={handleSavePreferences}
          loading={loading || categoriesLoading}
        />
      </main>
    </>
  );
}