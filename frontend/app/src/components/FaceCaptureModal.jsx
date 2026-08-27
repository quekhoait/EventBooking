import { useEffect, useRef, useState } from "react";

function FaceCaptureModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState("");
  const [capturedImage, setCapturedImage] = useState("");

  useEffect(() => {
    if (!isOpen) return undefined;
    let isActive = true;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Trình duyệt không hỗ trợ truy cập camera.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
      } catch {
        setCameraError("Không thể mở camera. Hãy cấp quyền truy cập và thử lại.");
      }
    };

    startCamera();

    return () => {
      isActive = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [isOpen]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.9));
  };

  const handleUsePhoto = () => {
    if (!capturedImage) return;
    onCapture(capturedImage);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="face-capture-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1b1c1d] p-5 text-white shadow-2xl sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[.2em] text-[#ff985c]">
              Xác thực khuôn mặt
            </p>
            <h2 id="face-capture-title" className="font-display text-3xl font-bold uppercase">
              Chụp khuôn mặt
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="text-2xl leading-none text-white/60 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black">
          {capturedImage ? (
            <img src={capturedImage} alt="Ảnh khuôn mặt đã chụp" className="h-full w-full object-cover" />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          )}
          {!capturedImage && !cameraError && (
            <div className="pointer-events-none absolute inset-[18%] rounded-[45%] border-2 border-dashed border-[#ff985c]/80" />
          )}
        </div>

        {cameraError && <p className="mt-3 text-sm text-red-300">{cameraError}</p>}
        <p className="mt-3 text-sm text-white/60">
          Đưa khuôn mặt vào khung và đảm bảo nơi chụp đủ ánh sáng.
        </p>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white/75 hover:bg-white/10"
          >
            Hủy
          </button>
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={() => setCapturedImage("")}
                className="rounded-xl border border-[#ff985c] px-4 py-3 text-sm font-bold text-[#ff985c] hover:bg-[#ff985c]/10"
              >
                Chụp lại
              </button>
              <button
                type="button"
                onClick={handleUsePhoto}
                className="rounded-xl bg-[#ff6b12] px-4 py-3 text-sm font-bold text-white hover:bg-[#e95b0c]"
              >
                Dùng ảnh này
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleCapture}
              disabled={Boolean(cameraError)}
              className="rounded-xl bg-[#ff6b12] px-4 py-3 text-sm font-bold text-white hover:bg-[#e95b0c] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Chụp ảnh
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FaceCaptureModal;
