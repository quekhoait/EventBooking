function TicketSelector({ tickets, selectedType, onSelect, quantities, onQuantityChange }) {
  return <div className="space-y-3">
    {tickets.map((ticket) => <div key={ticket.id} onClick={() => onSelect(ticket.id)} className={`flex w-full cursor-pointer items-center justify-between rounded-xl p-4 text-left panel-border ${selectedType === ticket.id ? 'border-[#ff6b12] bg-[#ff6b12]/10' : 'bg-white/[.03] hover:bg-white/[.06]'}`}>
      <span><span className="block font-bold text-white">{ticket.name}</span><span className="text-xs text-white/45">{ticket.description}</span></span>
      <span className="text-right"><span className="block font-bold text-[#ff985c]">{ticket.price.toLocaleString('vi-VN')} đ</span><span className="mt-1 inline-flex items-center gap-2 text-xs text-white/60"><button type="button" className="h-6 w-6 rounded border border-white/20" onClick={(event) => { event.stopPropagation(); onQuantityChange(ticket.id, -1) }}>-</button>{quantities[ticket.id]}<button type="button" className="h-6 w-6 rounded border border-white/20" onClick={(event) => { event.stopPropagation(); onQuantityChange(ticket.id, 1) }}>+</button></span></span>
    </div>)}
  </div>
}

export default TicketSelector;
