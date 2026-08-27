export default function Nav() {
  return (
    <nav className="hidden justify-center gap-16 bg-[#ffc18d] px-5 py-2 text-xs font-semibold uppercase md:flex">
      <a
        href="#music"
        className="transition-colors hover:text-[#e95b1c]"
      >
        Nhạc sống
      </a>
      <a
        href="#arts"
        className="text-[#e95b1c] transition-colors hover:underline"
      >
        Sân khấu & nghệ thuật
      </a>
      <a
        href="#sports"
        className="transition-colors hover:text-[#e95b1c]"
      >
        Thể thao
      </a>
      <a
        href="#workshop"
        className="transition-colors hover:text-[#e95b1c]"
      >
        Hội thảo & workshop
      </a>
    </nav>
  );
}

export default Nav;
