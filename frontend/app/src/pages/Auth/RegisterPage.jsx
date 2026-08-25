import { Link, useNavigate } from "react-router-dom";

import AuthInput from "../../components/Auth/AuthInput";
import AuthButton from "../../components/Auth/AuthButton";

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };

    console.log(data);

    navigate("/login");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0D0D0D] px-6 py-12">
      <section className="w-full max-w-[440px] rounded-2xl border border-[#2A2A2A] bg-[#F4F1EB] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.45)] sm:p-10">

   
        <header className="mb-8">
          <span className="text-[10px] font-bold tracking-[4px] text-[#171717]">
            HOKINUVA EVENTS
          </span>

          <h1 className="mt-3 text-[34px] font-extrabold tracking-[-1.5px] text-[#E85B2A] ">
            Đăng ký
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#5F5C57]">
            Tạo tài khoản để bắt đầu khám phá và đặt vé sự kiện.
          </p>
        </header>

   
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <AuthInput
            label="HỌ VÀ TÊN"
            name="name"
            placeholder="Nguyễn Văn A"
          />

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

          <AuthInput
            label="XÁC NHẬN MẬT KHẨU"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
          />

   
          <label className="flex cursor-pointer items-start gap-2 text-xs leading-5 text-[#5F5C57]">
            <input
              type="checkbox"
              required
              className="mt-1 accent-[#E85B2A]"
            />

            <span>
              Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật.
            </span>
          </label>

   
          <AuthButton>
            TẠO TÀI KHOẢN
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
    </main>
  );
}