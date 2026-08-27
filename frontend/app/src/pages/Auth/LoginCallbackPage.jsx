import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LoginCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;

    const token = searchParams.get("token");
    const username = searchParams.get("username");
    const role = searchParams.get("role");
    const id = searchParams.get("id");

    if (username || token) {
      hasProcessed.current = true; 
      
      loginUser({
        token: token || "dummy_token",
        username: username ? decodeURIComponent(username) : "BẠN",
        role: role || "",
        id: id || "",
      });

      navigate("/", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] text-white">
      <p className="animate-pulse">Đang hoàn tất đăng nhập...</p>
    </div>
  );
}