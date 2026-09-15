import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. Dedicated Login Page with Cinematic GSAP Rolling Door */}
          <Route path="/login" element={<LoginPage />} />

          {/* 2. Dedicated Dashboard Page with GSAP Grand Entrance & Collapsible Sidebar */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Fallback & Default Route -> Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
