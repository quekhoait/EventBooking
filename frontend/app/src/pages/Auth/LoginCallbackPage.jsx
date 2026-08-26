import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authServices from "../../services/authServices";
import RoleSelectionModal from "../../components/Auth/RoleSelectionModal";

export default function LoginCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const hasProcessed = useRef(false);

  const [loading, setLoading] = useState(true);
  const [submittingRole, setSubmittingRole] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [tempUser, setTempUser] = useState(null);

  useEffect(() => {
    if (hasProcessed.current) return;

    const token = searchParams.get("token");
    const username = searchParams.get("username");
    const rawRole = searchParams.get("role") || "";
    const id = searchParams.get("id");

    if (username || token) {
      hasProcessed.current = true;

      // Chuẩn hóa role bỏ prefix "RoleEnum." nếu có
      const cleanRole = rawRole.replace("RoleEnum.", "").trim().toUpperCase();

      const userData = {
        token: token || "dummy_token",
        username: username ? decodeURIComponent(username) : "BẠN",
        role: cleanRole,
        id: id || "",
      };

      // 1. NẾU LÀ TÀI KHOẢN MỚI (PENDING) -> DỪNG LẠI VÀ HIỆN MODAL CHỌN ROLE
      if (cleanRole === "PENDING" || cleanRole === "GUEST" || !cleanRole) {
        setTempUser(userData);
        setShowRoleModal(true);
        setLoading(false);
        return;
      }

      // 2. NẾU ĐÃ CÓ ROLE HỢP LỆ -> ĐĂNG NHẬP VÀ ĐIỀU HƯỚNG
      loginUser(userData);
      if (cleanRole === "STAFF" || cleanRole === "ADMIN") {
        navigate("/dashboard/organizer", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
  }, [searchParams, navigate, loginUser]);

  // Xử lý khi người dùng chọn nút trong Modal
  const handleSelectRole = async (selectedRole) => {
    if (!tempUser?.id) return;

    try {
      setSubmittingRole(true);

      // 1. Gọi API Backend để lưu role vào Database
      await authServices.updateRole({
        userId: tempUser.id,
        role: selectedRole,
      });

      // 2. Lưu vào AuthContext & localStorage
      const finalUser = {
        ...tempUser,
        role: selectedRole.toUpperCase(),
      };
      loginUser(finalUser);
      setShowRoleModal(false);

      // 3. Tiến vào hệ thống
      if (selectedRole === "STAFF" || selectedRole === "ADMIN") {
        navigate("/dashboard/organizer", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật vai trò:", err);
      alert(err.message || "Cập nhật vai trò thất bại. Vui lòng thử lại!");
    } finally {
      setSubmittingRole(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] text-white">
      {loading && !showRoleModal && (
        <p className="animate-pulse">Đang hoàn tất đăng nhập...</p>
      )}

      {/* Modal chọn vai trò */}
      <RoleSelectionModal
        isOpen={showRoleModal}
        onSelectRole={handleSelectRole}
        loading={submittingRole}
      />
    </div>
  );
}