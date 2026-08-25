function BookingProgress({ currentStep }) {
  const steps = ['Chọn vé', 'Thông tin', 'Thanh toán']
  return <div className="flex items-center gap-2 text-xs font-bold text-white/45 sm:gap-4">
    {steps.map((step, index) => <div className="flex items-center gap-2 sm:gap-4" key={step}>
      <div className={`flex h-7 w-7 items-center justify-center rounded-full border ${index <= currentStep ? 'border-[#ff6b12] bg-[#ff6b12] text-white' : 'border-white/20'}`}>{index + 1}</div>
      <span className={index <= currentStep ? 'text-white' : ''}>{step}</span>
      {index < steps.length - 1 && <span className="hidden text-white/20 sm:inline">/</span>}
    </div>)}
  </div>
}

export default BookingProgress