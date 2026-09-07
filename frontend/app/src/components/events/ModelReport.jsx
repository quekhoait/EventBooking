import { useState } from "react";

export default function ReportModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({ name: "", content: "" });

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
    setFormData({ name: "", content: "" });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm transition-opacity"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md transform rounded-xl bg-[#1e232d] p-6 text-white shadow-2xl transition-all border border-gray-700/50"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-amber-400">Gửi Báo Cáo</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Chủ để báo cáo
            </label>
            <input
              type="text"
              required
              placeholder="Nhập chủ đề báo cáo..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Nội dung báo cáo
            </label>
            <textarea
              rows={4}
              required
              placeholder="Mô tả chi tiết vấn đề..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full resize-none rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors font-semibold"
            >
              Gửi báo cáo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}