import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { baseDataService } from "../../services/baseDataService";
import companyServices from "../../services/companyServices";
import { eventService } from "../../services/eventService";
import EventForm from "../../components/events/EventForm";
import { emptyEventForm } from "../../components/events/eventModel";

const unwrapList = (response) => {
  const value = response?.data ?? response;
  return Array.isArray(value)
    ? value
    : Array.isArray(value?.data)
      ? value.data
      : [];
};

export default function CreateEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [companyId, setCompanyId] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  const [chatboxEnabled, setChatboxEnabled] = useState(false);
  const [chatboxLoading, setChatboxLoading] = useState(false);
  const [chatboxError, setChatboxError] = useState("");

  const handleGetChatboxStatus = async (eventId) => {
    if (!eventId) return;

    try {
      setChatboxLoading(true);
      setChatboxError("");

      const response = await eventService.getChatboxStatus(eventId);

      const data = response?.data ?? response;

      setChatboxEnabled(Boolean(data?.is_chatbox_enabled));
    } catch (error) {
      console.error("Error fetching chatbox status:", error);
      setChatboxError("Không thể lấy trạng thái chatbox.");
    } finally {
      setChatboxLoading(false);
    }
  };

  const handleSetChatboxStatus = async (eventId, isEnabled) => {
    if (!eventId) return;

    try {
      setChatboxLoading(true);
      setChatboxError("");

      const response = await eventService.setChatboxStatus(eventId, isEnabled);

      const data = response?.data ?? response;

      setChatboxEnabled(Boolean(data?.is_chatbox_enabled));
    } catch (error) {
      console.error("Error setting chatbox status:", error);
      setChatboxError("Không thể cập nhật trạng thái chatbox.");
    } finally {
      setChatboxLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      baseDataService.getAllCategories(),
      baseDataService.getAllLocations(),
      baseDataService.getTicketTypes(),
      user?.id
        ? companyServices.getCompanyByUserId(user.id)
        : Promise.resolve(null),
    ])
      .then(
        ([
          categoryResponse,
          locationResponse,
          ticketTypeResponse,
          companyResponse,
        ]) => {
          if (!active) return;
          setCategories(unwrapList(categoryResponse));
          setLocations(unwrapList(locationResponse));
          setTicketTypes(unwrapList(ticketTypeResponse));
          const company = companyResponse?.data ?? companyResponse;
          setCompanyId(company?.id ?? company?.company_id ?? null);
        },
      )
      .catch(() =>
        setError("Không thể tải dữ liệu biểu mẫu. Vui lòng thử lại."),
      )
      .finally(() => active && setLoadingData(false));
    return () => {
      active = false;
    };
  }, [user?.id]);

  if (!user) return <Navigate to="/login" replace />;
  if (!["STAFF", "ADMIN"].includes(String(user.role).toUpperCase()))
    return <Navigate to="/" replace />;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#0D0D0D] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link
            to="/profile"
            className="text-xs font-bold uppercase tracking-wider text-[#ff985c]"
          >
            ← Quay lại hồ sơ tổ chức
          </Link>
          <p className="mt-7 text-xs font-bold uppercase tracking-[.25em] text-[#ff985c]">
            Organizer studio
          </p>
          <h1 className="mt-2 font-display text-5xl font-extrabold uppercase leading-none text-white sm:text-6xl">
            Tạo sự kiện mới
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/50">
            Thiết lập thông tin chương trình, lịch bán vé và quy mô phục vụ
            khách tham dự.
          </p>
        </div>
        <div className="rounded-3xl border border-[#2A2A2A] bg-[#F4F1EB] p-6 shadow-[0_25px_80px_rgba(0,0,0,.45)] sm:p-10">
          <EventForm
            initialEvent={emptyEventForm}
            categories={categories}
            locations={locations}
            ticketTypes={ticketTypes}
            loadingData={loadingData}
            error={error}
            catalogMode
            saveContext={{ companyId, userId: user.id }}
            onCancel={() => navigate(-1)}
            chatboxEnabled={chatboxEnabled}
            chatboxLoading={chatboxLoading}
            chatboxError={chatboxError}
            onGetChatboxStatus={handleGetChatboxStatus}
            onSetChatboxStatus={handleSetChatboxStatus}
          />
        </div>
      </div>
    </main>
  );
}
