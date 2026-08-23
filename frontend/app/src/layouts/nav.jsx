import { useNavigate } from "react-router-dom";

function Nav({ onProfileClick, profileOpen, onHome }) {
  const navigate = useNavigate();
  const goHome = onHome || (() => navigate("/"));
  return (
    <header className="nav-shadow sticky top-0 z-20 bg-[#ff6b12] text-[#171717]">
      <div className="mx-auto flex max-w-[1440px] items-center gap-5 px-5 py-3 lg:px-10">
        <button onClick={goHome} className="shrink-0 text-left leading-none">
          <div className="font-display text-3xl font-extrabold italic tracking-tight">
            HOKIHUVA
          </div>          
        </button>
        <div className="mx-auto hidden min-w-0 max-w-xl flex-1 items-center rounded-full bg-white px-4 py-2 text-[#9d9696] shadow-[5px_5px_0_rgba(150,46,0,.35)] md:flex">
  <span className="mr-3 text-2xl leading-none select-none cursor-pointer"><i class="fa-solid fa-magnifying-glass text-lg"></i></span>
  <input
    type="text"
    placeholder="BẠN TÌM GÌ HÔM NAY?"
    className="w-full bg-transparent text-sm italic text-gray-800 placeholder-[#9d9696] outline-none"
  />
</div>
        <button
          onClick={onProfileClick}
         className="relative ml-auto flex items-center gap-2 whitespace-nowrap text-xs font-bold uppercase italic cursor-pointer hover:text-white">
          <span className="flex h-7 w-7 items-center justify-center">
            <i class="fa-regular fa-circle-user text-xl"></i>
          </span>
          <span className="hidden sm:inline">XIN CHÀO, V</span>
          <span><i class="fa-solid fa-angle-down"></i></span>
          {profileOpen && (
            <div className="absolute right-0 top-10 w-44 rounded-b-3xl rounded-tl-2xl bg-[#ffe6d2] p-4 text-left text-sm font-normal normal-case italic text-[#3b302b] shadow-xl">
              <div className="border-b border-[#e5b99c] pb-3">
                ◎ &nbsp; Tài khoản của tôi
              </div>
              <div className="border-b border-[#e5b99c] py-3">
                ♢ &nbsp; Vé đã đặt
              </div>
              <div className="pt-3">⇥ &nbsp; Đăng xuất</div>
            </div>
          )}
        </button>
      </div>
      <nav className="hidden justify-center gap-16 bg-[#ffc18d] px-5 py-2 text-xs font-semibold uppercase md:flex">
        <a href="#home">Nhạc sống</a>
        <a className="text-[#e95b1c]" href="#booking">
          Sân khấu & nghệ thuật
        </a>
        <a href="#sports">Thể thao</a>
        <a href="#workshop">Hội thảo & workshop</a>
      </nav>
    </header>
  );
}

export default Nav;
