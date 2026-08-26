import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthInput from "../../components/Auth/AuthInput";
import AuthButton from "../../components/Auth/AuthButton";
import authServices from "../../services/authServices";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginUser } = useAuth(); // Sử dụng đúng hàm loginUser từ AuthContext

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
      console.log("Login API response:", response);

      // 1. Trích xuất object data từ backend
      const resPayload = response.data !== undefined ? response.data : response;
      const rawUser = resPayload.data || resPayload;

      if (!rawUser || !rawUser.id) {
        throw new Error("Không tìm thấy thông tin tài khoản hợp lệ từ máy chủ!");
      }

      // 2. Chuẩn hóa Role và Token
      const cleanRole = String(rawUser.role || "USER").replace("RoleEnum.", "");
      // Lấy token nếu backend trả về, hoặc dùng cookie_session giả lập để vượt qua điều kiện (if token)
      const tokenValue =
        resPayload.access_token ||
        rawUser.access_token ||
        rawUser.token ||
        "authenticated_session";

      // 3. Chuẩn bị Object khớp với AuthContext
      const authData = {
        token: tokenValue,
        id: String(rawUser.id),
        username: rawUser.username,
        role: cleanRole,
        email: rawUser.email,
        avatar: rawUser.avatar,
        full_name: rawUser.full_name,
      };

      // 4. Gọi hàm loginUser của Context (Context sẽ tự lưu localStorage và setUser)
      loginUser(authData);

      // 5. Chuyển hướng sang trang chủ
      navigate("/");
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0D0D0D] px-6 py-12">
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
    </main>
  );
}