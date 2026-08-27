function BookingProgress({ currentStep = 0 }) {
  const steps = ["Chọn vé", "Thông tin", "Thanh toán"];

  return (
    <div className="flex items-center gap-2 text-xs font-bold text-white/45 sm:gap-4">
      {steps.map((step, index) => {
        const isActive = index <= currentStep;
        const isCurrent = index === currentStep;

        return (
          <div className="flex items-center gap-2 sm:gap-4" key={step}>
            {/* Số thứ tự bước */}
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                isActive
                  ? "border-[#ff6b12] bg-[#ff6b12] text-white shadow-[0_0_10px_rgba(255,107,18,0.3)]"
                  : "border-white/20 text-white/40"
              }`}
            >
              {index + 1}
            </div>

            {/* Tên bước */}
            <span
              className={`transition-colors ${
                isCurrent
                  ? "text-white font-extrabold"
                  : isActive
                  ? "text-white/80"
                  : "text-white/40"
              }`}
            >
              {step}
            </span>

            {/* Dấu gạch ngăn cách */}
            {index < steps.length - 1 && (
              <span className="hidden text-white/20 sm:inline">/</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default BookingProgress;