import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Nav from "./nav";

export default function Header() {
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();

  console.group("🎨 [STEP 3: HEADER RENDER]");
  console.log("Current User State:", user);
  console.log("Hiển thị giao diện:", user ? `Đã đăng nhập (${user.username})` : "Chưa đăng nhập (Nút Login)");
  console.groupEnd();

  const handleLogout = (e) => {
    e.stopPropagation();
    logoutUser();
    setProfileOpen(false);
    navigate("/login");
  };

  return (
    <header className="nav-shadow sticky top-0 z-20 bg-[#ff6b12] text-[#171717]">
      <div className="mx-auto flex max-w-[1440px] items-center gap-5 px-5 py-3 lg:px-10">
        <button onClick={() => navigate("/")} className="shrink-0 text-left leading-none cursor-pointer">
          <div className="font-display text-3xl font-extrabold italic tracking-tight text-[#171717]">
            HOKIHUVA
          </div>
        </button>

        <div className="mx-auto hidden min-w-0 max-w-xl flex-1 items-center rounded-full bg-white px-4 py-2 text-[#9d9696] shadow-[5px_5px_0_rgba(150,46,0,.35)] md:flex">
          <span className="mr-3 text-2xl leading-none select-none cursor-pointer">
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
              className="flex items-center gap-2 whitespace-nowrap text-xs font-bold uppercase italic cursor-pointer hover:text-white"
            >
              <span className="flex h-7 w-7 items-center justify-center">
                <i className="fa-regular fa-circle-user text-xl"></i>
              </span>
              <span className="hidden sm:inline">
                XIN CHÀO, {user.username || "BẠN"}
              </span>
              <span><i className="fa-solid fa-angle-down"></i></span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-10 w-48 rounded-b-3xl rounded-tl-2xl bg-[#ffe6d2] p-4 text-left text-sm font-normal normal-case italic text-[#3b302b] shadow-xl z-50">
                <div onClick={() => { setProfileOpen(false); navigate("/profile"); }} className="cursor-pointer border-b border-[#e5b99c] pb-3 hover:font-semibold">
                  ◎ &nbsp; Tài khoản của tôi
                </div>
                <div onClick={() => { setProfileOpen(false); navigate("/my-tickets"); }} className="cursor-pointer border-b border-[#e5b99c] py-3 hover:font-semibold">
                  ♢ &nbsp; Vé đã đặt
                </div>
                <div onClick={handleLogout} className="cursor-pointer pt-3 text-red-600 hover:font-bold">
                  ⇥ &nbsp; Đăng xuất
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-4 text-xs font-bold uppercase italic">
            <Link to="/login" className="hover:text-white">Đăng nhập</Link>
            <Link to="/register" className="rounded-full bg-black px-4 py-1.5 text-white hover:bg-[#2A2A2A]">Đăng ký</Link>
          </div>
        )}
      </div>

      <Nav />
    </header>
  );
}