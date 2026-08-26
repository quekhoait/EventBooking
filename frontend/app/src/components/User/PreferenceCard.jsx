import { FiCheck } from "react-icons/fi";

export default function PreferenceCard({
  title,
  description,
  icon,
  selected,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative min-h-[140px] rounded-xl border p-5 text-left transition ${
        selected
          ? "border-[#E85B2A] bg-[#FFF1EB]"
          : "border-[#2A2A2A] bg-[#171717] hover:border-[#555555]"
      }`}
    >
      {selected && (
        <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-[#E85B2A] text-white">
          <FiCheck className="text-xs" />
        </span>
      )}

      <span className="text-2xl">
        {icon}
      </span>

      <div className="mt-5">
        <h3
          className={`text-sm font-bold ${
            selected ? "text-[#171717]" : "text-white"
          }`}
        >
          {title}
        </h3>

        <p
          className={`mt-1 text-xs leading-5 ${
            selected ? "text-[#77736D]" : "text-[#777777]"
          }`}
        >
          {description}
        </p>
      </div>
    </button>
  );
}