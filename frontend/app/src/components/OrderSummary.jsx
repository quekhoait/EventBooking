function OrderSummary({
  event,
  quantity,
  ticketName,
  total,
  discount,
  discountCode,
  setDiscountCode,
  onApplyDiscount,
  onContinue,
  completed,
}) {
  return (
    <aside className="h-fit rounded-2xl bg-[#ffe6d2] p-5 text-[#241d1a] shadow-[8px_8px_0_rgba(255,107,18,.14)] lg:sticky lg:top-28">
      <div className="mb-5 flex items-start justify-between border-b border-[#d8b7a0] pb-4">
        <div>
          <p className="font-display text-2xl font-bold uppercase">
            {completed ? "Đơn hàng hoàn tất" : "Vé của bạn"}
          </p>
          <p className="text-xs text-[#806b60]">{event.name}</p>
        </div>
        <span className="rounded-full bg-[#ff6b12] px-2 py-1 text-[10px] font-bold text-white">
          {quantity} VÉ
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Ngày</span>
          <b>{event.date}</b>
        </div>
        <div className="flex justify-between">
          <span>Hạng vé</span>
          <b>{ticketName}</b>
        </div>
        <div className="flex justify-between">
          <span>Số lượng</span>
          <b>{quantity}</b>
        </div>
      </div>
      {!completed && (
        <>
          <div className="my-5 flex gap-2">
            <input
              value={discountCode}
              onChange={(inputEvent) =>
                setDiscountCode(inputEvent.target.value)
              }
              placeholder="Mã giảm giá"
              className="min-w-0 flex-1 rounded-lg border border-[#d8b7a0] bg-white/60 px-3 py-2 text-xs outline-none focus:border-[#ff6b12]"
            />
            <button
              onClick={onApplyDiscount}
              className="rounded-lg bg-[#33231d] px-3 text-xs font-bold text-white"
            >
              Áp dụng
            </button>
          </div>
          {discount > 0 && (
            <p className="mb-3 text-xs font-bold text-green-700">
              Đã giảm {discount.toLocaleString("vi-VN")} đ
            </p>
          )}
        </>
      )}
   
      <div className="flex items-end justify-between border-t border-[#d8b7a0] pt-4">
        <span className="text-xs">Tổng cộng</span>
        <strong className="font-display text-3xl text-[#d94f0d]">
          {total.toLocaleString("vi-VN")} đ
        </strong>
      </div>
      {!completed && (
        <button
          onClick={onContinue}
          disabled={!quantity}
          className="mt-5 w-full rounded-xl bg-[#ff6b12] py-3 text-sm font-extrabold text-white transition hover:bg-[#e95b0c] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Thanh toán ngay →
        </button>
      )}

      
    </aside>
  );
}

export default OrderSummary;
