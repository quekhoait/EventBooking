import { useEffect, useRef, useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ImageDropzone({ value, onChange, disabled = false }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (value?.startsWith("blob:")) URL.revokeObjectURL(value);
  }, [value]);

  const readFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn một file hình ảnh.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Ảnh không được vượt quá 5MB.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (!disabled) readFile(event.dataTransfer.files?.[0]);
  };

  return <div>
    <div
      onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`relative overflow-hidden rounded-xl border-2 border-dashed p-4 text-center transition ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${dragging ? "border-[#E85B2A] bg-[#fff0e7]" : "border-[#D6D1C8] bg-white hover:border-[#E85B2A]"}`}
    >
      {value ? <img src={value} alt="Xem trước ảnh sự kiện" className="h-40 w-full rounded-lg object-cover" /> : <div className="flex h-40 flex-col items-center justify-center text-[#8A8781]"><span className="text-3xl">↥</span><p className="mt-2 text-sm font-bold">Kéo thả ảnh vào đây</p><p className="mt-1 text-xs">hoặc bấm để chọn file · PNG, JPG tối đa 5MB</p></div>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" disabled={disabled} onChange={(event) => readFile(event.target.files?.[0])} />
    </div>
    {value && <button type="button" disabled={disabled} onClick={() => { onChange(""); if (inputRef.current) inputRef.current.value = ""; }} className="mt-2 text-xs font-bold uppercase text-red-500">Xóa ảnh</button>}
    {error && <p className="mt-2 text-xs font-semibold text-red-500">{error}</p>}
  </div>;
}
