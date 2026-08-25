import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthInput from "../../components/Auth/AuthInput";
import AuthButton from "../../components/Auth/AuthButton";
import AuthGoogleButton from "../../components/Auth/AuthGoogleButton";
import RoleSelectionModal from "../../components/Auth/RoleSelectionModal";

export default function LoginPage() {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    console.log("Login data:", data);

    const response = {
      isNewUser: true,
      role: null,
      hasPreferences: false,
    };

    if (response.isNewUser || !response.role) {
      setShowRoleModal(true);
    } else if (response.role === "organizer") {
      navigate("/dashboard/organizer");
    } else if (response.role === "personal") {
      if (!response.hasPreferences) {
        navigate("/onboarding/preferences");
      } else {
        navigate("/");
      }
    }
  };

  const handleGoogleLogin = () => {
    console.log("Google Login clicked");
  };

  return (
    <>
      <main className="flex min-h-screen items-center justify-center bg-[#0D0D0D] px-6 py-12">
        <section className="w-full max-w-[440px] rounded-2xl border border-[#2A2A2A] bg-[#F4F1EB] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.45)] sm:p-10">
          <header className="mb-8">
            <span className="text-[10px] font-bold tracking-[4px] text-[#171717]">
              HOKINUVA EVENTS
            </span>
            <h1 className="mt-3 text-[34px] font-extrabold tracking-[-1.5px] text-[#E85B2A]">
              Đăng nhập<span className="text-[#E85B2A]">.</span>
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#5F5C57]">
              Đăng nhập để tiếp tục sử dụng nền tảng đặt vé sự kiện.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <AuthInput
              label="EMAIL"
              name="email"
              type="email"
              placeholder="your@email.com"
            />

            <AuthInput
              label="MẬT KHẨU"
              name="password"
              type="password"
              placeholder="••••••••"
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex cursor-pointer items-center gap-2 text-[#5F5C57]">
                <input type="checkbox" className="accent-[#E85B2A]" />
                <span>Ghi nhớ đăng nhập</span>
              </label>

              <Link
                to="/forgot-password"
                className="font-medium text-[#E85B2A] hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <AuthButton>ĐĂNG NHẬP</AuthButton>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-[#D6D1C8]" />
              <span className="text-[10px] font-medium tracking-[1px] text-[#8A8781]">
                HOẶC
              </span>
              <div className="h-px flex-1 bg-[#D6D1C8]" />
            </div>

            <AuthGoogleButton onClick={handleGoogleLogin} />
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

      <RoleSelectionModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(true)}
      />
    </>
  );
}
