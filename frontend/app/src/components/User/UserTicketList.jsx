import React from "react";
import { Link } from "react-router-dom";
import UserTicketCard from "./UserTicketCard";

export default function UserTicketList({ tickets = [] }) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-2xl border border-[#2A2A2A] bg-[#F4F1EB] p-12 text-center">
        <p className="text-4xl">🎫</p>
        <h3 className="mt-3 text-lg font-bold text-[#171717]">Chưa có vé nào</h3>
        <p className="mt-1 text-xs text-[#5F5C57]">
          Bạn chưa đăng ký hoặc mua vé cho sự kiện nào.
        </p>
        <Link
          to="/"
          className="mt-5 inline-block rounded-xl bg-[#E85B2A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#d44d1e]"
        >
          KHÁM PHÁ SỰ KIỆN
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {tickets.map((tkt) => (
        <UserTicketCard key={tkt.id} ticket={tkt} />
      ))}
    </div>
  );
}