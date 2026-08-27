import React, { useState } from "react";
import { Link } from "react-router-dom";
import CompanyProfileForm from "../../components/User/CompanyProfileForm";

export default function CompanyProfilePage() {
  const [activeTab, setActiveTab] = useState("profile"); 

  const [locations] = useState([
    { id: 1, name: "TP. Hồ Chí Minh" },
    { id: 2, name: "Hà Nội" },
    { id: 3, name: "Đà Nẵng" },
    { id: 4, name: "Cần Thơ" },
  ]);

  const [company, setCompany] = useState({
    id: 102,
    name: "Hokinuva Media & Events",
    tax_code: "0316899988",
    address: "72 Lê Thánh Tôn, Phường Bến Nghé, Quận 1, TP.HCM",
    location_id: 1,
    description:
      "Đơn vị tiên phong trong việc tổ chức các lễ hội âm nhạc, triển lãm nghệ thuật và hội thảo công nghệ quy mô lớn tại Việt Nam.",
    logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80",
  });

  const [events] = useState([
    {
      id: "EVT-101",
      title: "TechFest Vietnam 2026: AI & The Future",
      date: "15/10/2026",
      ticketsSold: 1420,
      totalCapacity: 2000,
      status: "PUBLISHED",
    },
    {
      id: "EVT-102",
      title: "Indie Acoustic Night - Saigon Sunset Live",
      date: "28/09/2026",
      ticketsSold: 500,
      totalCapacity: 500,
      status: "SOLD_OUT",
    },
  ]);

  const handleUpdateCompany = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setCompany((prev) => ({
      ...prev,
      name: formData.get("name"),
      tax_code: formData.get("tax_code"),
      location_id: Number(formData.get("location_id")),
      address: formData.get("address"),
      description: formData.get("description"),
    }));

    alert("Đã cập nhật hồ sơ công ty thành công!");
  };

  const currentLocationName =
    locations.find((l) => l.id === company.location_id)?.name || "Chưa cập nhật";

  return (
    <main className="min-h-screen bg-[#0D0D0D] px-4 py-8 text-[#171717] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        
   
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/dashboard/organizer"
            className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#8A8781] hover:text-[#E85B2A]"
          >
            ← QUAY LẠI DASHBOARD
          </Link>
          <span className="text-[10px] font-bold tracking-[4px] text-[#8A8781]">
            ORGANIZER MANAGEMENT
          </span>
        </div>

   
        <section className="mb-8 overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#F4F1EB] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.3)] sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            
   
            <div className="relative">
              <img
                src={company.logo || "/static/image/icon_company.png"}
                alt={company.name}
                onError={(e) => {
                  e.target.src =
                    "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80";
                }}
                className="h-24 w-24 rounded-2xl border-2 border-[#E85B2A] bg-white object-contain p-1 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 rounded-full bg-[#E85B2A] px-2 py-0.5 text-[9px] font-bold uppercase text-white shadow">
                ĐỐI TÁC
              </span>
            </div>

   
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-black tracking-tight text-[#171717] sm:text-3xl">
                  {company.name}
                </h1>
                <span className="font-mono text-xs font-bold text-[#8A8781]">
                  (MST: {company.tax_code})
                </span>
              </div>

              <p className="mt-1 text-xs text-[#5F5C57]">{company.address}</p>

   
              <div className="mt-3.5 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#D6D1C8] bg-white px-3 py-1 text-xs font-semibold text-[#171717] shadow-sm">
                  📍 {currentLocationName}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#D6D1C8] bg-white px-3 py-1 text-xs font-semibold text-[#171717] shadow-sm">
                  🎪 {events.length} Sự kiện đã tạo
                </span>
              </div>
            </div>
          </div>

   
          <div className="mt-8 flex border-b border-[#D6D1C8]">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`border-b-2 px-4 pb-3 text-xs font-bold tracking-wider transition-all sm:text-sm ${
                activeTab === "profile"
                  ? "border-[#E85B2A] text-[#E85B2A]"
                  : "border-transparent text-[#5F5C57] hover:text-[#171717]"
              }`}
            >
              HỒ SƠ CÔNG TY
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("events")}
              className={`border-b-2 px-4 pb-3 text-xs font-bold tracking-wider transition-all sm:text-sm ${
                activeTab === "events"
                  ? "border-[#E85B2A] text-[#E85B2A]"
                  : "border-transparent text-[#5F5C57] hover:text-[#171717]"
              }`}
            >
              SỰ KIỆN ĐÃ TỔ CHỨC ({events.length})
            </button>
          </div>
        </section>

   
        {activeTab === "profile" && (
          <CompanyProfileForm
            company={company}
            locations={locations}
            onSubmit={handleUpdateCompany}
          />
        )}

   
        {activeTab === "events" && (
          <div className="space-y-4">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#2A2A2A] bg-[#F4F1EB] p-5 shadow-md sm:flex-row sm:items-center sm:p-6"
              >
                <div>
                  <span className="font-mono text-[10px] font-bold text-[#E85B2A]">
                    {evt.id} • Ngày: {evt.date}
                  </span>
                  <h3 className="mt-1 text-base font-extrabold text-[#171717]">
                    {evt.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#5F5C57]">
                    Đã bán: <span className="font-bold text-[#171717]">{evt.ticketsSold}</span> / {evt.totalCapacity} vé
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                      evt.status === "SOLD_OUT"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {evt.status === "SOLD_OUT" ? "HẾT VÉ" : "ĐANG MỞ BÁN"}
                  </span>

                  <Link
                    to={`/events/${evt.id}/manage`}
                    className="rounded-xl border border-[#D6D1C8] bg-white px-3.5 py-2 text-xs font-bold text-[#171717] transition hover:border-[#E85B2A] hover:text-[#E85B2A]"
                  >
                    Quản lý
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}