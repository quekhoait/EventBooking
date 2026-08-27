import { useState, useEffect } from "react";
import AuthButton from "./AuthButton";

export default function OtpModal({ isOpen, email, onVerify, onResend, onClose, loading }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(120); // 2 phút

  // Đếm ngược thời gian hết hạn OTP
  useEffect(() => {
    if (!isOpen) return;
    setCountdown(120);
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Tự động focus ô tiếp theo
    if (element.nextSibling && element.value !== "") {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length === 6) {
      onVerify(otpCode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[420px] rounded-2xl border border-[#2A2A2A] bg-[#F4F1EB] p-6 shadow-2xl sm:p-8">
        <div className="text-center">
          <span className="text-[10px] font-bold tracking-[4px] text-[#171717]">
            XÁC THỰC EMAIL
          </span>
          <h2 className="mt-2 text-2xl font-extrabold text-[#E85B2A]">
            Nhập mã OTP
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#5F5C57]">
            Mã xác thực đã được gửi tới <br />
            <span className="font-semibold text-black">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          {/* 6 Ô nhập OTP */}
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={(e) => e.target.select()}
                className="h-12 w-10 sm:w-12 rounded-lg border border-gray-300 bg-white text-center text-xl font-bold text-gray-900 outline-none transition-all focus:border-[#E85B2A] focus:ring-2 focus:ring-[#E85B2A]/20"
              />
            ))}
          </div>

          <div className="text-center text-xs text-[#5F5C57]">
            {countdown > 0 ? (
              <span>
                Mã hết hạn sau:{" "}
                <b className="text-[#E85B2A]">
                  {Math.floor(countdown / 60)}:
                  {("0" + (countdown % 60)).slice(-2)}
                </b>
              </span>
            ) : (
              <button
                type="button"
                onClick={onResend}
                className="font-bold text-[#E85B2A] hover:underline"
              >
                Gửi lại mã OTP
              </button>
            )}
          </div>

          <AuthButton type="submit" disabled={loading || otp.join("").length < 6}>
            {loading ? "ĐANG XÁC THỰC..." : "XÁC NHẬN"}
          </AuthButton>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-gray-500 hover:text-black"
          >
            Hủy và quay lại
          </button>
        </form>
      </div>
    </div>
  );
}