import { useState } from "react";
import { useNavigate } from "react-router-dom";


export default function Login() {
  const [text, setText] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // KIỂM TRA TÀI KHOẢN CỨNG
    if (text === "admin" && password === "admin123") {
      localStorage.setItem("isAdminLoggedIn", "true");
      navigate("/"); // Chuyển vào trang chủ
    } else {
      alert("Sai tài khoản hoặc mật khẩu admin!");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="w-96 rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-center">Admin Login</h2>
        <input 
          type="text" placeholder="Tên đăng nhập" 
          className="mb-4 w-full rounded border p-2"
          onChange={(e) => setText(e.target.value)} 
        />
        <input 
          type="password" placeholder="Mật khẩu" 
          className="mb-6 w-full rounded border p-2"
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button type="submit" className="w-full rounded bg-primary p-2 text-white hover:bg-primary/90">
          Đăng nhập
        </button>
      </form>
    </div>
  );
}