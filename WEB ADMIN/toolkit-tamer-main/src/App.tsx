import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "./pages/Dashboard";
import DistrictsPage from "./pages/DistrictsPage";
import CategoriesPage from "./pages/CategoriesPage";
import ToursPage from "./pages/ToursPage";
import RestaurantsPage from "./pages/RestaurantsPage";
import TagsPage from "./pages/TagsPage";
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
          <Route path="/districts" element={<DistrictsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/tours" element={<ToursPage />} />
          <Route path="/restaurants" element={<RestaurantsPage />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
