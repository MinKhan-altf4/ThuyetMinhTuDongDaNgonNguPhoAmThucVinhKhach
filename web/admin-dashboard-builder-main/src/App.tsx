import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "./pages/Dashboard";
import StallOwners from "./pages/StallOwners";
import Stalls from "./pages/Stalls";
import Permissions from "./pages/Permissions";
import SystemSettings from "./pages/SystemSettings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login"; // ✅ thêm

const queryClient = new QueryClient();

// ✅ Component bảo vệ route — chuyển về /login nếu chưa đăng nhập
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = localStorage.getItem("isAdminLoggedIn");
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* ✅ Route công khai */}
          <Route path="/login" element={<Login />} />

          {/* ✅ Các route được bảo vệ */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/stall-owners" element={<ProtectedRoute><StallOwners /></ProtectedRoute>} />
          <Route path="/stalls" element={<ProtectedRoute><Stalls /></ProtectedRoute>} />
          <Route path="/permissions" element={<ProtectedRoute><Permissions /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SystemSettings /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
