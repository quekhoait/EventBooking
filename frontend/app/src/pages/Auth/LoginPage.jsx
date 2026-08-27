import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthInput from "../../components/Auth/AuthInput";
import AuthButton from "../../components/Auth/AuthButton";
import AuthGoogleButton from "../../components/Auth/AuthGoogleButton";
import RoleSelectionModal from "../../components/Auth/RoleSelectionModal";
import PreferenceModal from "../../components/User/PreferenceModal";
import authServices from "../../services/authServices";
import { useAuth } from "../../context/AuthContext";
import { useCategories } from "../../hooks/useCategories";
import { isPendingRole } from "../../utils/authHelper";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const { categories, loading: categoriesLoading } = useCategories();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Role Selection Modal State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [tempAuthData, setTempAuthData] = useState(null);

  // Preference Modal State
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  // Lọc bỏ danh mục "Tất cả" (id: null)
  const validCategories = (categories || []).filter((cat) => cat.id !== null);

  // [LOG THEO DÕI STATE MODAL]
  useEffect(() => {
    console.log("[STATE DEBUG] Trạng thái showPrefModal hiện tại:", showPrefModal);
    console.log("[STATE DEBUG] Dữ liệu tempAuthData:", tempAuthData);
    console.log("[STATE DEBUG] Danh sách validCategories:", validCategories);
  }, [showPrefModal, tempAuthData, validCategories]);

  const routeByRoleAndPreferences = (authData) => {
    console.log("\n--- [BẮT ĐẦU KIỂM TRA ĐIỀU HƯỚNG] ---");
    console.log("1. authData nhận vào:", authData);

    const cleanRole = String(authData.role || "")
      .toUpperCase()
      .replace("ROLEENUM.", "")
      .trim();

    // Chuyển đổi linh hoạt giá trị has_preferences về boolean
    const hasPreferences =
      authData.has_preferences === true ||
      authData.has_preferences === "true" ||
      authData.has_preferences === 1;

    console.log("2. Role sau khi làm sạch:", cleanRole);
    console.log("3. hasPreferences (boolean):", hasPreferences);

    // 1. Quản trị viên / Nhân viên
    if (cleanRole === "STAFF" || cleanRole === "ADMIN") {
      console.log("-> Nhánh STAFF/ADMIN: Điều hướng sang /dashboard/organizer");
      loginUser(authData);
      navigate("/dashboard/organizer");
      return;
    }

    // 2. Người dùng thông thường (USER hoặc mặc định)
    if (cleanRole === "USER" || cleanRole === "") {
      console.log("-> Nhánh USER");

      if (!hasPreferences) {
        console.log("ĐIỀU KIỆN THỎA MÃN: USER chưa có preferences -> KÍCH HOẠT MODAL!");
        setTempAuthData(authData);
        setShowPrefModal(true); // BẬT MODAL
        return;
      }

      console.log("-> USER đã có preferences -> Điều hướng sang /");
      loginUser(authData);
      navigate("/");
      return;
    }

    console.log("-> Role khác -> Điều hướng sang /");
    loginUser(authData);
    navigate("/");
  };

  const handleLoginSuccess = (resPayload) => {
    console.log("\n================ [LOGIN THÀNH CÔNG] ================");
    console.log("Payload gốc từ Backend:", resPayload);

    const rawUser = resPayload.data || resPayload.user || resPayload;

    if (!rawUser) {
      console.error("Không tìm thấy thông tin rawUser trong payload!");
      throw new Error("Không tìm thấy thông tin tài khoản hợp lệ từ máy chủ!");
    }

    const rawRole = rawUser.role;
    const tokenValue =
      resPayload.access_token ||
      rawUser.access_token ||
      rawUser.token ||
      "authenticated_session";

    const hasPreferences = Boolean(
      rawUser.has_preferences ?? !resPayload.needs_setup_preferences
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

    console.log("authData đóng gói chuẩn bị xử lý:", authData);

    // Kiểm tra nếu tài khoản đang Pending Role
    if (isPendingRole(rawRole)) {
      console.log("Tài khoản PENDING ROLE -> Mở RoleSelectionModal");
      setTempAuthData(authData);
      setShowRoleModal(true);
      return;
    }

    routeByRoleAndPreferences(authData);
  };

  const handleSelectRole = async (selectedRole) => {
    try {
      setLoading(true);
      setErrorMsg("");
      console.log("Đang cập nhật role thành:", selectedRole);

      if (authServices.updateRole) {
        await authServices.updateRole({
          userId: tempAuthData?.id,
          role: selectedRole.toLowerCase(),
        });
      }

      const updatedAuthData = {
        ...tempAuthData,
        role: selectedRole,
      };

      setShowRoleModal(false);
      routeByRoleAndPreferences(updatedAuthData);
    } catch (err) {
      console.error("❌ Lỗi khi chọn role:", err);
      setErrorMsg("Không thể cập nhật loại tài khoản. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategory = (id) => {
    setSelectedCategoryIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      console.log("[MODAL] Danh sách ID đã chọn hiện tại:", updated);
      return updated;
    });
  };

  const handleSavePreferences = async () => {
    console.log("[MODAL] Bấm xác nhận với danh sách ID:", selectedCategoryIds);
    if (selectedCategoryIds.length === 0) {
      alert("Vui lòng chọn ít nhất 1 thể loại yêu thích!");
      return;
    }

    try {
      setLoading(true);

      if (authServices.savePreferences) {
        await authServices.savePreferences({
          userId: tempAuthData?.id,
          categories: selectedCategoryIds,
        });
      }

      const finalAuthData = {
        ...tempAuthData,
        has_preferences: true,
      };

      console.log("✅ Lưu thành công! Tiến hành loginUser và vào trang chủ:", finalAuthData);
      loginUser(finalAuthData);
      setShowPrefModal(false);
      navigate("/");
    } catch (err) {
      console.error("❌ Lỗi khi lưu preferences:", err);
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

    try {
      setLoading(true);
      console.log("Gửi request login thường...");
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
      const authUrl =response?.data?.auth_url ||
        response?.auth_url ||
        response?.data?.url ||
        response?.url;

      if (!authUrl) {
        throw new Error("Không nhận được đường dẫn xác thực Google từ máy chủ!");
      }

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

      {/* Modal 1: Chọn Role */}
      <RoleSelectionModal
        isOpen={showRoleModal}
        onSelectRole={handleSelectRole}
        loading={loading}
      />

      {/* Modal 2: Bắt buộc chọn Sở thích */}
      <PreferenceModal
        isOpen={showPrefModal}
        categories={validCategories}
        selectedIds={selectedCategoryIds}
        onToggleCategory={handleToggleCategory}
        onSave={handleSavePreferences}
        loading={loading || categoriesLoading}
      />
    </main>
  );
}