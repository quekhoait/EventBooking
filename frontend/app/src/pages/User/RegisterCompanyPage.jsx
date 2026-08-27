import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import companyServices from "../../services/companyServices";
import CompanyForm from "../../components/Company/CompanyForm";
import GlobalLoadingOverlay from "../../components/Common/GlobalLoadingOverlay";

export default function RegisterCompanyPage() {
  const navigate = useNavigate();
  const { user, loginUser } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    tax_code: "",
    address: "",
    description: "",
    location_id: "",
  });

  const [locations, setLocations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // Nạp danh sách địa điểm
  useEffect(() => {
    companyServices
      .getLocations()
      .then((res) => {
        if (res?.data) setLocations(res.data);
      })
      .catch((err) => console.error("Lỗi nạp địa điểm:", err));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.tax_code.trim() ||
      !formData.address.trim() ||
      !formData.description.trim()
    ) {
      setErrorMsg("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    setIsSubmitting(true);
    setSubmitProgress(20);

    const progressTimer = setInterval(() => {
      setSubmitProgress((prev) => (prev >= 85 ? 85 : prev + 15));
    }, 100);

    try {
      const payload = {
        user_id: user?.id,
        name: formData.name.trim(),
        tax_code: formData.tax_code.trim(),
        address: formData.address.trim(),
        description: formData.description.trim(),
        location_id: formData.location_id ? Number(formData.location_id) : null,
      };

      await companyServices.saveCompany(payload);

      clearInterval(progressTimer);
      setSubmitProgress(100);

      // Cập nhật AuthContext với has_company = true
      loginUser({
        ...user,
        has_company: true,
      });

      setTimeout(() => {
        setIsSubmitting(false);
        navigate("/profile", { replace: true });
      }, 300);
    } catch (error) {
      clearInterval(progressTimer);
      setIsSubmitting(false);
      setSubmitProgress(0);
      console.error("Lỗi đăng ký công ty:", error);
      setErrorMsg(
        error.response?.data?.message || "Không thể đăng ký doanh nghiệp. Vui lòng thử lại!"
      );
    }
  };

  return (
    <>
      <GlobalLoadingOverlay
        isLoading={isSubmitting}
        progress={submitProgress}
        title="Đang khởi tạo hồ sơ doanh nghiệp..."
        description="Đang xác thực thông tin pháp nhân của bạn"
      />

      <main className=" mb-[80px] flex min-h-[calc(100vh-80px)] w-full items-center justify-center bg-[#0D0D0D] px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl">
          <div className="mb-6 text-center">
            <span className="font-mono text-xs font-bold tracking-[3px] text-[#E85B2A]">
              BƯỚC 2: KHỞI TẠO TỔ CHỨC
            </span>
            <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              HỒ SƠ PHÁP NHÂN
            </h1>
            <p className="mt-1 text-xs text-[#8A8781]">
              Cung cấp thông tin doanh nghiệp để đủ điều kiện đăng tải và bán vé sự kiện.
            </p>
          </div>

          {/* Form Box */}
          <div className="rounded-3xl border border-[#2A2A2A] bg-[#F4F1EB] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] sm:p-10">
            {errorMsg && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                ⚠️ {errorMsg}
              </div>
            )}

            <CompanyForm
              formData={formData}
              locations={locations}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              loading={isSubmitting}
              progress={submitProgress}
              isEdit={false}
            />
          </div>
        </div>
      </main>
    </>
  );
}