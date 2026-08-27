import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Nav from "./nav";
import GlobalLoadingOverlay from "../components/Common/GlobalLoadingOverlay";

export default function Header() {
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();

  // State quản lý Loading toàn cục khi chuyển trang
  const [isNavigating, setIsNavigating] = useState(false);
  const [navProgress, setNavProgress] = useState(0);
  const [navTitle, setNavTitle] = useState("Đang chuyển trang...");

  // Hàm chuyển hướng có hiệu ứng loading chạy %
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

  const handleLogout = (e) => {
    e.stopPropagation();
    setProfileOpen(false);
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
      {/* Component Loading Toàn Cục khi chuyển trang */}
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

          <div className="mx-auto hidden min-w-0 max-w-xl flex-1 items-center rounded-full bg-white px-4 py-2 text-[#9d9696] shadow-[5px_5px_0_rgba(150,46,0,.35)] md:flex">
            <span className="mr-3 cursor-pointer text-2xl leading-none select-none">
              <i className="fa-solid fa-magnifying-glass text-lg"></i>
            </span>
            <input
              type="text"
              placeholder="BẠN TÌM GÌ HÔM NAY?"
              className="w-full bg-transparent text-sm italic text-gray-800 placeholder-[#9d9696] outline-none"
            />
          </div>

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
        </div>

        <Nav onNavigate={handleNavigateWithLoading} />
      </header>
    </>
  );
}