import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DigitalTicketPage from "./DigitalTicketPage";
import { ticketService } from "../services/ticketServices";

export function PreviewTicket() {
	const navigate = useNavigate();
	const [result, setResult] = useState(null);	
	const [error, setError] = useState("");
	const [searchParams] = useSearchParams();
	const ticketCode = searchParams.get("extraData");
	const [loading, setLoading] = useState(Boolean(ticketCode));
	useEffect(() => {
		if (!ticketCode) return;
		let isCurrent = true;
		const fetchTicket = async () => {
			try {
				const response = await ticketService.getTicket(ticketCode);
				if (isCurrent) setResult(response?.data?.data );
			} catch (fetchError) {
				console.error("Lỗi tải thông tin vé:", fetchError);
				if (isCurrent) {
					setError(
						fetchError.response?.data?.detail ||
						"Không thể tải thông tin vé.",
					);
				}
			} finally {
				if (isCurrent) setLoading(false);
			}
		};

		fetchTicket();
		return () => {
			isCurrent = false;
		};
	}, [ticketCode]);

	if (loading) {
		return <main className="mx-auto max-w-2xl px-5 py-20 text-center text-white/60">Đang tải thông tin vé...</main>;
	}

	if (error || !result) {
		return (
			<main className="mx-auto max-w-2xl px-5 py-20 text-center">
				<h1 className="font-display text-4xl font-bold uppercase text-white">
					{error || "Chưa có thông tin vé"}
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