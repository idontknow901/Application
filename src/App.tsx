import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import PassedBanner from "@/components/PassedBanner";
import Index from "./pages/Index";
import Apply from "./pages/Apply";
import Results from "./pages/Results";
import Track from "./pages/Track";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

import { useLocation } from "react-router-dom";

const AppContent = () => {
  const location = useLocation();
  return (
    <>
      <Navbar />
      <PassedBanner />
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/results" element={<Results />} />
        <Route path="/track" element={<Track />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
