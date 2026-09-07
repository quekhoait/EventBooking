export default function EventModal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-2xl bg-[#F4F1EB] p-5 text-[#171717] shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-3xl font-bold uppercase">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="text-3xl text-[#8A8781]">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
