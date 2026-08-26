export default function AuthButton({ children }) {
  return (
    <button
      type="submit"
      className="h-[53px] w-full bg-[#FF622F] text-[10px] font-bold tracking-[3px] text-white transition hover:bg-[#E95020]"
    >
      {children}
    </button>
  );
}