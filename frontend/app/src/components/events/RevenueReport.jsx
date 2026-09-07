import { useMemo, useState } from "react";

const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const getStats = (event) => event.ticketTypes.reduce((result, ticket) => ({
  sold: result.sold + ticket.sold,
  capacity: result.capacity + ticket.capacity,
  revenue: result.revenue + ticket.sold * ticket.price,
}), { sold: 0, capacity: 0, revenue: 0 });

export default function RevenueReport({ events }) {
  const [range, setRange] = useState("month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const rankedEvents = useMemo(() => events
    .filter((event) => {
      const eventDate = new Date(event.startTime || event.date);
      const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
      const to = toDate ? new Date(`${toDate}T23:59:59`) : null;
      return (!from || eventDate >= from) && (!to || eventDate <= to);
    })
    .map((event) => ({ event, stats: getStats(event) }))
    .sort((a, b) => b.stats.revenue - a.stats.revenue)
    .slice(0, 5), [events, fromDate, toDate]);
  const maxRevenue = Math.max(...rankedEvents.map((item) => item.stats.revenue), 1);
  const totalRevenue = rankedEvents.reduce((sum, item) => sum + item.stats.revenue, 0);
  const totalSold = rankedEvents.reduce((sum, item) => sum + item.stats.sold, 0);

  return <section className="space-y-5 rounded-2xl border border-white/10 bg-[#F4F1EB] p-5 text-[#171717] sm:p-7"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#E85B2A]">Sales analytics</p><h2 className="mt-2 font-display text-3xl uppercase">Top 5 sự kiện</h2><p className="mt-1 text-sm text-[#8A8781]">Xếp hạng theo doanh thu trong khoảng thời gian đã chọn.</p></div><div className="flex flex-wrap gap-2"><select value={range} onChange={(e) => setRange(e.target.value)} className="rounded-lg border border-[#D6D1C8] bg-white px-3 py-2 text-xs font-bold uppercase"><option value="day">Theo ngày</option><option value="month">Theo tháng</option><option value="year">Theo năm</option></select><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border border-[#D6D1C8] bg-white px-3 py-2 text-xs" /><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border border-[#D6D1C8] bg-white px-3 py-2 text-xs" /></div></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[#171717] p-4 text-white"><small>Doanh thu top 5</small><strong className="mt-2 block text-lg text-[#ff985c]">{money(totalRevenue)}</strong></div><div className="rounded-xl bg-[#171717] p-4 text-white"><small>Vé top 5</small><strong className="mt-2 block text-lg">{totalSold.toLocaleString("vi-VN")}</strong></div><div className="rounded-xl bg-[#171717] p-4 text-white"><small>Gom nhóm</small><strong className="mt-2 block text-lg">{range === "day" ? "Ngày" : range === "year" ? "Năm" : "Tháng"}</strong></div></div><div className="space-y-4"><div className="flex h-64 items-end gap-3 border-b border-[#D6D1C8] px-2 pb-8 sm:gap-6">{rankedEvents.map(({ event, stats }, index) => <div key={event.id} className="group flex h-full min-w-0 flex-1 flex-col justify-end"><div className="relative flex h-full items-end"><div title={`${event.name}: ${money(stats.revenue)}`} style={{ height: `${Math.max((stats.revenue / maxRevenue) * 100, 5)}%` }} className="w-full rounded-t-lg bg-[#ff6b12] transition hover:bg-[#E85B2A]"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 transition group-hover:opacity-100">#{index + 1}</span></div></div><span className="mt-2 truncate text-center text-[10px] font-bold text-[#5F5C57]">{event.name}</span></div>)}</div><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-[#D6D1C8] text-[10px] uppercase text-[#8A8781]"><tr><th className="py-3"># / Sự kiện</th><th>Vé đã bán</th><th>Lấp đầy</th><th className="text-right">Doanh thu</th></tr></thead><tbody>{rankedEvents.map(({ event, stats }, index) => <tr key={event.id} className="border-b border-[#D6D1C8]/70"><td className="py-3 font-bold">{index + 1}. {event.name}</td><td>{stats.sold} / {stats.capacity}</td><td>{stats.capacity ? `${((stats.sold / stats.capacity) * 100).toFixed(1)}%` : "0%"}</td><td className="text-right font-bold text-[#E85B2A]">{money(stats.revenue)}</td></tr>)}</tbody></table></div></div><p className="text-xs text-[#8A8781]">Bộ lọc ngày/tháng/năm đã sẵn sàng để nối dữ liệu báo cáo từ API theo khoảng thời gian tương ứng.</p></section>;
}
