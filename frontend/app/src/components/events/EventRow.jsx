import { money, statsFor, statusLabel } from "./eventManagementUtils";

export default function EventRow({
  event,
  onOpen,
  onEdit,
  onAddDiscount,
  onDelete,
}) {
  const stats = statsFor(event);
  return (
    <article
      onClick={() => onOpen(event)}
      className="grid cursor-pointer gap-4 border-b border-[#D6D1C8] p-5 transition hover:bg-white lg:grid-cols-[minmax(230px,1.5fr)_120px_130px_150px_auto] lg:items-center"
    >
      <div className="flex gap-3">
        <img
          src={event.image}
          alt=""
          className="h-16 w-20 rounded-lg object-cover"
        />
        <div>
          <h3 className="font-display text-xl uppercase">{event.name}</h3>
          <p className="mt-1 text-xs text-[#8A8781]">
            {event.category} · {event.date} · {event.venue}
          </p>
          <span className="mt-2 inline-block rounded-full bg-[#171717] px-2 py-1 text-[10px] font-bold uppercase text-white">
            {statusLabel[event.status]}
          </span>
        </div>
      </div>
      <div>
        <small>Đã bán</small>
        <strong className="block">
          {stats.sold} / {stats.capacity}
        </strong>
      </div>
      <div>
        <small>Doanh thu</small>
        <strong className="block">{money(stats.revenue)}</strong>
      </div>
      <div>
        <small>Loại vé</small>
        <strong className="block">{event.ticketTypes?.length || 0} loại</strong>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(event);
          }}
          className="rounded-lg border border-[#D6D1C8] px-3 py-2 text-[10px] font-bold uppercase"
        >
          Sửa
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddDiscount(event);
          }}
          className="rounded-lg border border-[#E85B2A] px-3 py-2 text-[10px] font-bold uppercase text-[#E85B2A]"
        >
          + Discount
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(event);
          }}
          className="rounded-lg border border-red-200 px-3 py-2 text-[10px] font-bold uppercase text-red-500"
        >
          Xóa
        </button>
      </div>
    </article>
  );
}
