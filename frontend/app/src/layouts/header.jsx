import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
// import Nav from "./nav";
import GlobalLoadingOverlay from "../components/common/GlobalLoadingOverlay";
import NotificationModal from "../components/events/ModelNoti";
import { BASE_URL } from "../config/Apis";
import { eventService } from "../services/eventService";

const SOCKET_URL = BASE_URL.replace(/\/api\/?$/, "");

export default function Header() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); 
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navProgress, setNavProgress] = useState(0);
  const [navTitle, setNavTitle] = useState("Đang chuyển trang...");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const unreadNotifications = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    if (!user?.id) return;

    const fetchReports = async () => {
      try {
        const res = await eventService.getReportByUser();
        const rawData = res.data?.data || [];
          console.log(rawData)
        const formattedNotifications = rawData.map((item) => ({
          id: `report-${item.id}`,
          type: "report_created",
          title: `Báo cáo mới: ${item.event?.name || item.name || "Sự kiện"}`,
          message: item.content || "Có báo cáo mới cho sự kiện của bạn",
          event_id: item.event_id,
          report: item,
          created_at: item.created_at || new Date().toISOString(),
          read: item.is_read || false, 
        }));

        setNotifications(formattedNotifications);
      } catch (err) {
        console.error("Lỗi khi tải thông báo từ database:", err);
      }
    };

    fetchReports(); // <-- Bắt buộc phải gọi hàm này
  }, [user?.id]);

  // 2. Lắng nghe thông báo Realtime từ Socket
  useEffect(() => {
    if (!user?.id) return undefined;

    const socket = io(SOCKET_URL, { withCredentials: true });

    const handleConnect = () => {
      socket.emit("join_user_room", { user_id: user.id });
    };

    const handleReportCreated = (payload) => {
      console.log("Socket payload:", payload);
      setNotifications((currentNotifications) => [
        {
          id: `report-${payload.report?.id || Date.now()}`,
          type: payload.type || "report_created",
          title: "Báo cáo mới: " + (payload.report?.event?.name || payload.report?.name || ""),
          message: payload.content || "Có báo cáo mới cho sự kiện của bạn",
          event_id: payload.event_id,
          report: payload.report,
          created_at: new Date().toISOString(),
          read: false,
        },
        ...currentNotifications,
      ]);
    };

    socket.on("connect", handleConnect);
    socket.on("report_created", handleReportCreated);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("report_created", handleReportCreated);
      socket.disconnect();
    };
  }, [user?.id]);

  const handleNavigateWithLoading = (targetPath, title = "Đang chuyển trang...") => {
    setProfileOpen(false);
    setNavTitle(title);
    setIsNavigating(true);
    setNavProgress(25);

    const progressTimer = setInterval(() => {
      setNavProgress((prev) => (prev >= 90 ? 90 : prev + 25));
    }, 60);

    setTimeout(() => {
      clearInterval(progressTimer);
      setNavProgress(100);

      setTimeout(() => {
        setIsNavigating(false);
        setNavProgress(0);
        navigate(targetPath);
      }, 150);
    }, 250);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchTerm.trim();
    const targetPath = query ? `/events?keyword=${encodeURIComponent(query)}` : "/events";
    handleNavigateWithLoading(targetPath, "Đang tìm kiếm sự kiện...");
  };

  const handleLogout = (e) => {
    e.stopPropagation();
    setProfileOpen(false);
    setNotifications([]);
    setNavTitle("Đang đăng xuất...");
    setIsNavigating(true);
    setNavProgress(30);

    const progressTimer = setInterval(() => {
      setNavProgress((prev) => (prev >= 90 ? 90 : prev + 20));
    }, 60);

    setTimeout(() => {
      clearInterval(progressTimer);
      setNavProgress(100);
      logoutUser();

      setTimeout(() => {
        setIsNavigating(false);
        setNavProgress(0);
        navigate("/login");
      }, 150);
    }, 300);
  };

  return (
    <>
      <GlobalLoadingOverlay
        isLoading={isNavigating}
        progress={navProgress}
        title={navTitle}
        description="Vui lòng chờ trong giây lát"
      />

      <header className="nav-shadow sticky top-0 z-20 bg-[#ff6b12] text-[#171717]">
        <div className="mx-auto flex max-w-[1440px] items-center gap-5 px-5 py-3 lg:px-10">
          <button
            onClick={() => handleNavigateWithLoading("/", "Đang về trang chủ...")}
            className="shrink-0 cursor-pointer text-left leading-none"
          >
            <div className="font-display text-3xl font-extrabold italic tracking-tight text-[#171717]">
              HOKIHUVA
            </div>
          </button>

          <form
            onSubmit={handleSearchSubmit}
            className="mx-auto hidden min-w-0 max-w-xl flex-1 items-center rounded-full bg-white px-4 py-2 text-[#9d9696] shadow-[5px_5px_0_rgba(150,46,0,.35)] md:flex"
          >
            <button type="submit" className="mr-3 text-2xl leading-none select-none cursor-pointer">
              <i className="fa-solid fa-magnifying-glass text-lg"></i>
            </button>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="BẠN TÌM GÌ HÔM NAY? (ENTER ĐỂ TÌM)"
              className="w-full bg-transparent text-sm italic text-gray-800 placeholder-[#9d9696] outline-none"
            />
          </form>

          {user ? (
            <div className="relative ml-auto">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-xs font-bold uppercase italic hover:text-white"
              >
                <span className="flex h-7 w-7 items-center justify-center">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="h-7 w-7 rounded-full object-cover border border-white"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80";
                      }}
                    />
                  ) : (
                    <i className="fa-regular fa-circle-user text-xl"></i>
                  )}
                </span>
                <span className="hidden sm:inline">
                  XIN CHÀO, {user.full_name || user.username || "BẠN"}
                </span>
                <span>
                  <i className="fa-solid fa-angle-down"></i>
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-10 z-50 w-48 rounded-b-3xl rounded-tl-2xl bg-[#ffe6d2] p-4 text-left text-sm font-normal normal-case italic text-[#3b302b] shadow-xl animate-fade-in">
                  {user && (user.role === "STAFF" || user.role === "ADMIN") && (
                     <div
                    onClick={() =>
                      handleNavigateWithLoading(
                        "/dashboard/organizer",
                        "Đang mở quản lý sự kiện..."
                      )
                    }
                    className="cursor-pointer border-b border-[#e5b99c] pb-3 hover:font-semibold"
                  >
                    ◎ &nbsp; Quản lý sự kiện
                  </div>
                  )}
                  <div
                    onClick={() =>
                      handleNavigateWithLoading(
                        "/profile",
                        "Đang tải hồ sơ tài khoản..."
                      )
                    }
                    className="cursor-pointer border-b border-[#e5b99c] pb-3 hover:font-semibold"
                  >
                    ◎ &nbsp; Tài khoản của tôi
                  </div>
                  <div
                    onClick={() =>
                      handleNavigateWithLoading(
                        "/my-tickets",
                        "Đang tải danh sách vé..."
                      )
                    }
                    className="cursor-pointer border-b border-[#e5b99c] py-3 hover:font-semibold"
                  >
                    ♢ &nbsp; Vé đã đặt
                  </div>
                  <div
                    onClick={handleLogout}
                    className="cursor-pointer pt-3 text-red-600 hover:font-bold"
                  >
                    ⇥ &nbsp; Đăng xuất
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="ml-auto flex items-center gap-4 text-xs font-bold uppercase italic">
              <button
                type="button"
                onClick={() =>
                  handleNavigateWithLoading("/login", "Đang tới trang đăng nhập...")
                }
                className="hover:text-white cursor-pointer"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() =>
                  handleNavigateWithLoading("/register", "Đang tới trang đăng ký...")
                }
                className="rounded-full bg-black px-4 py-1.5 text-white hover:bg-[#2A2A2A] cursor-pointer"
              >
                Đăng ký
              </button>
            </div>
          )}


        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((isOpen) => !isOpen);
              setProfileOpen(false);
            }}
            aria-label="Mở thông báo"
            aria-expanded={notificationsOpen}
            className="relative inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900"
          >
            <i className="fa-solid fa-bell text-lg" />
            {unreadNotifications > 0 && (
              <span className="absolute -right-1 -top-1 flex h-3 min-w-3 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white ring-2 ring-white">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </button>
          <NotificationModal
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            notifications={notifications}
          />
        </div>
        </div>


        {/* <Nav
          onNavigate={handleNavigateWithLoading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchSubmit={handleSearchSubmit}
        /> */}
      </header>
    </>
  );
}