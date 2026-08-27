import { FcGoogle } from "react-icons/fc";

export default function AuthGoogleButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer flex h-[52px] w-full items-center justify-center gap-3 rounded-lg border border-[#C8C3BA] bg-white text-sm font-semibold text-[#202124] transition hover:bg-[#F8F8F8] active:scale-[0.99]"
    >
      <FcGoogle className="text-[20px]" />

      <span>Đăng nhập bằng Google</span>
    </button>
  );
}