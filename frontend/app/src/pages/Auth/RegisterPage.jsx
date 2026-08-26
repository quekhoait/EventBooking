import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthInput from "../../components/Auth/AuthInput";
import AuthButton from "../../components/Auth/AuthButton";
import OtpModal from "../../components/Auth/OtpModal";
import authServices from "../../services/authServices"; // Hoặc axios từ config API của bạn

export default function RegisterPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Quản lý trạng thái OTP Modal
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // 1. Submit Form Đăng ký -> Mở Modal OTP
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData(event.currentTarget);
    const username = formData.get("username")?.trim();
    const email = formData.get("email")?.trim();
    const password = formData.get("password");
    const confirm_password = formData.get("confirm_password");
    const role = formData.get("role") || "user";

    if (password !== confirm_password) {
      setErrorMsg("Mật khẩu xác nhận không khớp!");
      return;
    }

    const payload = {
      username,
      email,
      password,
      confirm_password,
      role,
    };

    try {
      setLoading(true);
      await authServices.register(payload);

      setRegisteredEmail(email);
      setShowOtpModal(true); // Đăng ký thành công -> Mở Modal nhập OTP
    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      const message =
        err.response?.data?.message ||
        "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Xác thực mã OTP gửi từ Modal
  // Xác thực mã OTP gửi từ Modal
  const handleVerifyOtp = async (otpCode) => {
    try {
      setLoading(true);

      const response = await authServices.verifyOtp({
        email: registeredEmail,
        verification_code: otpCode, // Gửi đúng key 'verification_code'
      });

      setShowOtpModal(false);
      setSuccessMsg(
        response.message ||
          "Xác thực email thành công! Đang chuyển đến trang đăng nhập...",
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error("Lỗi xác thực OTP:", err);
      const message =
        err.response?.data?.message ||
        "Mã xác thực không chính xác hoặc đã hết hạn!";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    try {
      const response = await authServices.resendOtp({ email: registeredEmail });
      alert(response.message || "Đã gửi lại mã OTP vào email của bạn!");
    } catch (err) {
      alert(err.response?.data?.message || "Không thể gửi lại mã OTP lúc này!");
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
            Đăng ký
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#5F5C57]">
            Tạo tài khoản để bắt đầu khám phá và đặt vé sự kiện.
          </p>
        </header>

        {errorMsg && (
          <div className="mb-5 rounded-lg border border-red-300 bg-red-100 p-3 text-xs font-semibold text-red-700">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-5 rounded-lg border border-green-300 bg-green-100 p-3 text-xs font-semibold text-green-700">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <input type="hidden" name="role" value="user" />

          <AuthInput
            label="TÊN ĐĂNG NHẬP"
            name="username"
            placeholder="nguyenvana"
            required
          />

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

          <AuthInput
            label="XÁC NHẬN MẬT KHẨU"
            name="confirm_password"
            type="password"
            placeholder="••••••••"
            required
          />

          <label className="flex cursor-pointer items-start gap-2 text-xs leading-5 text-[#5F5C57]">
            <input type="checkbox" required className="mt-1 accent-[#E85B2A]" />
            <span>
              Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật.
            </span>
          </label>

          <AuthButton type="submit" disabled={loading}>
            {loading ? "ĐANG XỬ LÝ..." : "TẠO TÀI KHOẢN"}
          </AuthButton>
        </form>

        <footer className="mt-7 text-center text-xs text-[#5F5C57]">
          Đã có tài khoản?
          <Link
            to="/login"
            className="ml-2 font-bold text-[#E85B2A] hover:underline"
          >
            ĐĂNG NHẬP
          </Link>
        </footer>
      </section>

      {/* Modal OTP */}
      <OtpModal
        isOpen={showOtpModal}
        email={registeredEmail}
        loading={loading}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        onClose={() => setShowOtpModal(false)}
      />
    </main> 
  );
}
