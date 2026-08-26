import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthButton from "./AuthButton";

export default function RoleSelectionModal({ isOpen = true, onClose }) {
  const [selectedRole, setSelectedRole] = useState(null); 
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleContinue = () => {
    if (selectedRole === "personal") {
      navigate("/onboarding/preferences");
    } else if (selectedRole === "organizer") {
      navigate("/dashboard/organizer");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <section className="w-full max-w-[500px] rounded-2xl border border-[#2A2A2A] bg-[#F4F1EB] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.6)] sm:p-10">
        <header className="mb-6 text-center">
          <span className="text-[10px] font-bold tracking-[4px] text-[#171717]">
            HOKINUVA ONBOARDING
          </span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#E85B2A] sm:text-3xl">
            Mục đích của bạn là gì?
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#5F5C57]">
            Hãy chọn loại tài khoản để chúng tôi tối ưu trải nghiệm dành riêng cho bạn.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div
            onClick={() => setSelectedRole("personal")}
            className={`cursor-pointer rounded-xl border-2 p-5 transition-all duration-200 ${
              selectedRole === "personal"
                ? "border-[#E85B2A] bg-[#E85B2A]/5 shadow-md"
                : "border-[#D6D1C8] bg-white hover:border-[#8A8781]"
            }`}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#E85B2A]/10 text-xl text-[#E85B2A]">
              👤
            </div>
            <h3 className="font-bold text-[#171717]">Cá nhân</h3>
            <p className="mt-1 text-xs text-[#5F5C57] leading-relaxed">
              Tìm kiếm, khám phá và đặt vé tham gia các sự kiện yêu thích.
            </p>
          </div>

          <div
            onClick={() => setSelectedRole("organizer")}
            className={`cursor-pointer rounded-xl border-2 p-5 transition-all duration-200 ${
              selectedRole === "organizer"
                ? "border-[#E85B2A] bg-[#E85B2A]/5 shadow-md"
                : "border-[#D6D1C8] bg-white hover:border-[#8A8781]"
            }`}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#E85B2A]/10 text-xl text-[#E85B2A]">
              🏢
            </div>
            <h3 className="font-bold text-[#171717]">Đơn vị tổ chức</h3>
            <p className="mt-1 text-xs text-[#5F5C57] leading-relaxed">
              Đăng tải, quản lý bán vé và theo dõi doanh thu sự kiện.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <AuthButton onClick={handleContinue} disabled={!selectedRole}>
            TIẾP TỤC
          </AuthButton>
        </div>
      </section>
    </div>
  );
}