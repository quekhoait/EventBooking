// src/components/Auth/RoleSelectionModal.jsx
import { FaUser, FaBuilding } from "react-icons/fa";

export default function RoleSelectionModal({ isOpen, onSelectRole, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#3A3A3A] bg-[#1A1A1A] p-6 text-white shadow-2xl sm:p-8">
        <header className="text-center">
          <span className="text-[10px] font-bold tracking-[3px] text-[#E85B2A]">
            BƯỚC TIẾP THEO
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Chọn loại tài khoản
          </h2>
          <p className="mt-2 text-xs text-[#9CA3AF]">
            Vui lòng chọn mục đích sử dụng để hoàn tất việc thiết lập tài khoản.
          </p>
        </header>

        <div className="mt-6 flex flex-col gap-4">
          {/* Lựa chọn 1: Tài khoản cá nhân */}
          <button
            type="button"
            onClick={() => onSelectRole("USER")}
            disabled={loading}
            className="group flex items-center gap-4 rounded-xl border border-[#2E2E2E] bg-[#242424] p-4 text-left transition hover:border-[#E85B2A] hover:bg-[#2A2A2A] disabled:opacity-50"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#E85B2A]/10 text-[#E85B2A] transition group-hover:bg-[#E85B2A] group-hover:text-white">
              <FaUser className="text-xl" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Tạo tài khoản cá nhân
              </h3>
              <p className="mt-1 text-xs text-[#8A8A8A]">
                Dành cho cá nhân tham gia sự kiện và đặt vé.
              </p>
            </div>
          </button>

          {/* Lựa chọn 2: Đơn vị tổ chức */}
          <button
            type="button"
            onClick={() => onSelectRole("STAFF")}
            disabled={loading}
            className="group flex items-center gap-4 rounded-xl border border-[#2E2E2E] bg-[#242424] p-4 text-left transition hover:border-[#E85B2A] hover:bg-[#2A2A2A] disabled:opacity-50"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#E85B2A]/10 text-[#E85B2A] transition group-hover:bg-[#E85B2A] group-hover:text-white">
              <FaBuilding className="text-xl" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Tạo tài khoản cho đơn vị tổ chức
              </h3>
              <p className="mt-1 text-xs text-[#8A8A8A]">
                Dành cho doanh nghiệp hoặc ban tổ chức quản lý sự kiện.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}