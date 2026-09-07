import EventModal from "./EventModal";
import { money, statsFor, statusLabel } from "./eventManagementUtils";

export default function EventDetail({ event, onRemoveDiscount, onClose }) {
  const stats = statsFor(event);
  return <EventModal title={event.name} onClose={onClose}><div className="space-y-6"><div className="flex gap-4"><img src={event.image} alt="" className="h-32 w-48 rounded-xl object-cover" /><div><p className="font-bold uppercase text-[#E85B2A]">{event.category} · {statusLabel[event.status]}</p><p className="mt-2 text-sm text-[#5F5C57]">{event.description}</p><p className="mt-2 text-xs text-[#8A8781]">{event.date} · {event.venue}</p></div></div><div className="grid gap-3 sm:grid-cols-3"><Metric label="Doanh thu" value={money(stats.revenue)} accent /><Metric label="Vé đã bán" value={`${stats.sold} / ${stats.capacity}`} /><Metric label="Tỷ lệ lấp đầy" value={stats.capacity ? `${((stats.sold / stats.capacity) * 100).toFixed(1)}%` : "0%"} /></div><h3 className="font-display text-2xl uppercase">Loại vé</h3>{(event.ticketTypes || []).map((ticket) => <div key={ticket.id} className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-[#D6D1C8] py-2 text-sm"><span>{ticket.name}</span><span>{ticket.sold} / {ticket.capacity}</span><strong>{money(ticket.sold * ticket.price)}</strong></div>)}<h3 className="font-display text-2xl uppercase">Discount của sự kiện</h3>{(event.discounts || []).map((discount) => <div key={discount.id} className="flex justify-between border-b border-[#D6D1C8] py-2 text-sm"><strong>{discount.code}</strong><span>{discount.unit === "percentage" ? `${discount.value}%` : money(discount.value)}</span><button type="button" onClick={() => onRemoveDiscount(event.id, discount.id)} className="text-xs font-bold text-red-500">Xóa</button></div>)}{!event.discounts?.length && <p className="text-sm text-[#8A8781]">Chưa có discount.</p>}</div></EventModal>;
}

function Metric({ label, value, accent = false }) {
  return <div className="rounded-xl bg-[#171717] p-4 text-white"><small>{label}</small><strong className={`mt-2 block text-lg ${accent ? "text-[#ff985c]" : ""}`}>{value}</strong></div>;
}
