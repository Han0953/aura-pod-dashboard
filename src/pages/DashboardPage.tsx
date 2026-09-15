import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import gsap from "gsap";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { OverviewView } from "@/views/OverviewView";
import { MonitoringView } from "@/views/MonitoringView";
import { DeviceView } from "@/views/DeviceView";
import { useDashboardData } from "@/services/dashboardService";
import { useTheme } from "@/context/ThemeContext";
import { ViewId } from "@/types/navigation";
import { cn } from "@/lib/utils";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isEntrance, setIsEntrance] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<ViewId>("overview");
  const isFirstMount = useRef(true);

  const dashboard = useDashboardData();
  const { theme } = useTheme();

  // GSAP animation when sidebar expands or collapses
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    // 1. Smooth fluid reposition of the Topbar title block
    gsap.fromTo(
      "#topbar-title-block",
      { x: isSidebarCollapsed ? 12 : -12, opacity: 0.8 },
      { x: 0, opacity: 1, duration: 0.35, ease: "power2.out" }
    );

    // 2. Tactile re-layout breathing on dashboard bento cards
    gsap.fromTo(
      ".dashboard-stagger-card",
      { scale: 0.992 },
      { scale: 1, duration: 0.3, stagger: 0.015, ease: "power2.out" }
    );
  }, [isSidebarCollapsed]);

  // Detect ?entrance=1 from Rolling Door transition
  useEffect(() => {
    if (searchParams.get("entrance") === "1") {
      setIsEntrance(true);

      // Silently clean URL parameter without stripping CSS/repainting
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {}

      const timer = setTimeout(() => {
        setIsEntrance(false);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleLogout = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  const handleNavigateToDevice = () => {
    setActiveView("device");
  };

  return (
    <div
      data-theme={theme}
      className={cn(
        "flex h-screen w-screen overflow-hidden transition-colors duration-200 bg-aura-bg text-aura-text-primary",
        theme === "dark" ? "dark" : "light"
      )}
    >
      {/* Collapsible Left Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        isEspOnline={dashboard.deviceStatus.online}
        onRefresh={dashboard.refreshData}
        isRefreshing={dashboard.isRefreshing}
        isEntrance={isEntrance}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar Header */}
        <Topbar
          activeView={activeView}
          lastUpdatedText={dashboard.lastUpdatedText}
          notifications={dashboard.notifications}
          unreadNotificationCount={dashboard.unreadNotificationCount}
          onMarkAllAsRead={dashboard.markAllNotificationsAsRead}
          onClearAllNotifications={dashboard.clearAllNotifications}
        />

        {/* Scrollable View Canvas */}
        <main className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 transition-colors duration-200 bg-aura-bg">
          <div className="max-w-7xl mx-auto">
            {activeView === "overview" && (
              <OverviewView
                dashboard={dashboard}
                onNavigateToDevice={handleNavigateToDevice}
                isEntrance={isEntrance}
              />
            )}

            {activeView === "monitoring" && (
              <MonitoringView dashboard={dashboard} />
            )}

            {activeView === "device" && (
              <DeviceView dashboard={dashboard} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
