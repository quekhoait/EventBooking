import { useLocation, useNavigate } from "react-router-dom";
import DigitalTicketPage from "./DigitalTicketPage";

export function PreviewTicket() {
	const location = useLocation();
	const navigate = useNavigate();
	const result = location.state?.result;

	if (!result) {
		return (
			<main className="mx-auto max-w-2xl px-5 py-20 text-center">
				<h1 className="font-display text-4xl font-bold uppercase text-white">
					Chưa có thông tin vé
				</h1>
				<button
					type="button"
					onClick={() => navigate("/")}
					className="mt-6 rounded-xl bg-[#ff6b12] px-5 py-3 text-sm font-bold text-white"
				>
					Về trang chủ
				</button>
			</main>
		);
	}

	return <DigitalTicketPage result={result} onHome={() => navigate("/")} />;
}