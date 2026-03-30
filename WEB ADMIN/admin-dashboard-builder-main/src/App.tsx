import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "./pages/Dashboard";
import StallOwners from "./pages/StallOwners";
import Stalls from "./pages/Stalls";
import Dishes from "./pages/Dishes";
import Customers from "./pages/Customers";
import Permissions from "./pages/Permissions";
import SystemSettings from "./pages/SystemSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stall-owners" element={<StallOwners />} />
          <Route path="/stalls" element={<Stalls />} />
          <Route path="/dishes" element={<Dishes />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/settings" element={<SystemSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
