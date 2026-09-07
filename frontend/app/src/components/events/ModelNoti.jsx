import { eventService } from "../../services/eventService";

export default function NotificationModal({ isOpen, onClose, notifications = [] }) {
	if (!isOpen) return null;



	return (
		<div
			className="absolute right-0 top-10 z-50 w-[min(calc(100vw-2rem),360px)] overflow-hidden rounded-2xl border border-[#e5b99c] bg-[#fff7f0] text-left text-[#3b302b] shadow-2xl"
			role="dialog"
			aria-label="Thông báo"
		>
			<div className="flex items-center justify-between border-b border-[#f0d4c0] px-4 py-3">
				<div>
					<p className="text-xs font-bold uppercase tracking-[.18em] text-[#e85b2a]">
						Cập nhật mới
					</p>
					<h2 className="mt-1 text-lg font-bold">Thông báo</h2>
				</div>
				<button
					type="button"
					onClick={onClose}
					aria-label="Đóng thông báo"
					className="flex h-8 w-8 items-center justify-center rounded-full text-[#8a6b5b] transition-colors hover:bg-[#ffe6d2] hover:text-[#3b302b]"
				>
					<i className="fa-solid fa-xmark" />
				</button>
			</div>

			<div className="max-h-80 overflow-y-auto">
				{notifications.length ? (
					notifications.map((notification, index) => (
						<div
							key={notification.id || index}
							className={`border-b border-[#f0d4c0] px-4 py-3 last:border-b-0 ${
								notification.read ? "bg-transparent" : "bg-[#fff0e4]"
							}`}
						>
							<div className="flex gap-3">
								<span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ff6b12] text-white">
									<i className="fa-solid fa-bell text-xs" />
								</span>
								<div className="min-w-0">
									<p className="text-sm font-bold">
										{notification.title || "Thông báo mới"}
									</p>
									{notification.message && (
										<p className="mt-1 text-xs leading-5 text-[#735f55]">
											{notification.message}
										</p>
									)}
									{notification.created_at && (
										<p className="mt-1 text-[11px] text-[#a08474]">
											{new Date(notification.created_at).toLocaleString("vi-VN")}
										</p>
									)}
								</div>
							</div>
						</div>
					))
				) : (
					<div className="px-5 py-10 text-center">
						<i className="fa-regular fa-bell-slash text-2xl text-[#c79c83]" />
						<p className="mt-3 text-sm font-semibold">Chưa có thông báo</p>
						<p className="mt-1 text-xs text-[#8a6b5b]">
							Các cập nhật mới sẽ xuất hiện ở đây.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
