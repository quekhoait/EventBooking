export default function AuthInput({
  label,
  name,
  type = "text",
  placeholder,
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={name}
        className="text-[11px] font-semibold tracking-[1.5px] text-[#1A1A1A]"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className="h-[52px] w-full rounded-lg border border-[#C8C3BA] bg-[#FFFFFF] px-4 text-sm font-medium text-[#171717] outline-none transition placeholder:text-[#8A8781] focus:border-[#E85B2A] focus:ring-1 focus:ring-[#E85B2A]"
      />
    </div>
  );
}