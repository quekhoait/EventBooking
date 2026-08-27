// src/pages/Auth/LoginCallbackPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authServices from "../../services/authServices";
import companyServices from "../../services/companyServices";
import RoleSelectionModal from "../../components/Auth/RoleSelectionModal";
import GlobalLoadingOverlay from "../../components/Common/GlobalLoadingOverlay";

export default function LoginCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const hasProcessed = useRef(false);

  // Loading & Role Selection State
  const [submittingRole, setSubmittingRole] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [tempUser, setTempUser] = useState(null);

  // Global Progress Overlay State
  const [isProcessing, setIsProcessing] = useState(true);
  const [progress, setProgress] = useState(15);
  const [progressMessage, setProgressMessage] = useState("Đang xác thực tài khoản Google...");

  useEffect(() => {
    if (hasProcessed.current) return;

    const token = searchParams.get("token");
    const id = searchParams.get("id");
    const username = searchParams.get("username");
    const rawRole = searchParams.get("role") || "";
    const email = searchParams.get("email") || "";
    const fullName = searchParams.get("full_name") || username || "";
    const avatar = searchParams.get("avatar") || "";
    const phoneNumber = searchParams.get("phone_number") || "";

    const isActive = searchParams.get("is_active") !== "false";
    const isVerified = searchParams.get("is_verified") === "true";
    const hasPreferences = searchParams.get("has_preferences") === "true";
    let hasCompany = searchParams.get("has_company") === "true";

    if (username || token) {
      hasProcessed.current = true;
      const cleanRole = rawRole.replace("RoleEnum.", "").trim().toUpperCase();

      // Lưu token vào localStorage để các request axios sau có header Bearer
      if (token) {
        localStorage.setItem("access_token", token);
      }

      const userData = {
        token: token || "dummy_token",
        id: Number(id) || id,
        username: username ? decodeURIComponent(username) : "Người dùng",
        full_name: fullName ? decodeURIComponent(fullName) : "",
        email: email ? decodeURIComponent(email) : "",
        phone_number: phoneNumber,
        avatar: avatar ? decodeURIComponent(avatar) : "",
        role: cleanRole,
        is_active: isActive,
        is_verified: isVerified,
        has_preferences: hasPreferences,
        has_company: hasCompany,
      };

      // Timer giả lập tiến trình xác thực mượt mà
      const progressTimer = setInterval(() => {
        setProgress((prev) => (prev >= 80 ? 80 : prev + 15));
      }, 70);

      const processNavigation = async () => {
        // 1. TÀI KHOẢN MỚI CHƯA CHỌN ROLE
        if (cleanRole === "PENDING" || cleanRole === "GUEST" || !cleanRole) {
          clearInterval(progressTimer);
          setIsProcessing(false);
          setTempUser(userData);
          setShowRoleModal(true);
          return;
        }

        // 2. NẾU LÀ STAFF/ORGANIZER: Kiểm tra thông tin công ty từ backend nếu URL chưa có
        if (["STAFF", "ORGANIZER"].includes(cleanRole) && !hasCompany && userData.id) {
          setProgressMessage("Đang kiểm tra hồ sơ doanh nghiệp...");
          try {
            const compRes = await companyServices.getCompanyByUserId(userData.id);
            if (compRes?.data?.id) {
              hasCompany = true;
              userData.has_company = true;
            }
          } catch (err) {
            console.warn("Chưa có thông tin công ty:", err);
          }
        }

        // 3. LƯU VÀO CONTEXT
        loginUser(userData);

        clearInterval(progressTimer);
        setProgress(100);

        // 4. ĐIỀU HƯỚNG
        setTimeout(() => {
          setIsProcessing(false);
          if (cleanRole === "STAFF" || cleanRole === "ORGANIZER") {
            navigate(hasCompany ? "/dashboard/organizer" : "/register-company", { replace: true });
          } else if (cleanRole === "ADMIN") {
            navigate("/dashboard/organizer", { replace: true });
          } else {
            navigate(hasPreferences ? "/" : "/select-preferences", { replace: true });
          }
        }, 300);
      };

      processNavigation();
    } else {
      setIsProcessing(false);
      navigate("/login", { replace: true });
    }
  }, [searchParams, navigate, loginUser]);

  // Xử lý khi người dùng chọn Role trong Modal
  const handleSelectRole = async (selectedRole) => {
    if (!tempUser?.id) return;
    try {
      setSubmittingRole(true);
      const cleanSelectedRole = selectedRole.toUpperCase();

      await authServices.updateRole({
        userId: tempUser.id,
        role: cleanSelectedRole,
      });

      const finalUser = {
        ...tempUser,
        role: cleanSelectedRole,
      };

      loginUser(finalUser);
      setShowRoleModal(false);

      setIsProcessing(true);
      setProgress(100);
      setProgressMessage("Đang khởi tạo không gian làm việc...");

      setTimeout(() => {
        setIsProcessing(false);
        if (cleanSelectedRole === "STAFF" || cleanSelectedRole === "ORGANIZER") {
          navigate("/register-company", { replace: true });
        } else if (cleanSelectedRole === "ADMIN") {
          navigate("/dashboard/organizer", { replace: true });
        } else {
          navigate("/select-preferences", { replace: true });
        }
      }, 300);
    } catch (err) {
      console.error("Lỗi cập nhật vai trò:", err);
      alert(err.message || "Không thể lưu vai trò!");
      setSubmittingRole(false);
    }
  };

  return (
    <>
      <GlobalLoadingOverlay
        isLoading={isProcessing && !showRoleModal}
        progress={progress}
        title={progressMessage}
        description="Vui lòng không đóng trình duyệt"
      />

      <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] text-white">
        <RoleSelectionModal
          isOpen={showRoleModal}
          onSelectRole={handleSelectRole}
          loading={submittingRole}
        />
      </div>
    </>
  );
}