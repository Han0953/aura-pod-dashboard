import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import gsap from "gsap";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { OverviewView } from "@/views/OverviewView";
import { MonitoringView } from "@/views/MonitoringView";
import { DeviceView } from "@/views/DeviceView";
import { AnalyticsView } from "@/views/AnalyticsView";
import { SettingsView } from "@/views/SettingsView";
import { useDashboardData } from "@/services/dashboardService";
import { useTheme } from "@/context/ThemeContext";
import { ViewId } from "@/types/navigation";
import { cn } from "@/lib/utils";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Synchronously detect ?entrance=1 from URL search params on mount
  const isEntrance = useRef(searchParams.get("entrance") === "1").current;
  // Read saved collapsed state from localStorage on initial render
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("aura_sidebar_collapsed");
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Read saved active tab from localStorage on initial render, unless arriving fresh from login (?entrance=1)
  const [activeView, setActiveView] = useState<ViewId>(() => {
    if (isEntrance) {
      try {
        localStorage.setItem("aura_active_view", "overview");
      } catch {}
      return "overview";
    }
    try {
      const saved = localStorage.getItem("aura_active_view");
      if (
        saved &&
        (saved === "overview" ||
          saved === "monitoring" ||
          saved === "device" ||
          saved === "analytics" ||
          saved === "settings")
      ) {
        return saved as ViewId;
      }
    } catch {}
    return "overview";
  });

  const mainContentRef = useRef<HTMLElement>(null);

  const handleViewChange = useCallback((view: ViewId) => {
    setActiveView(view);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    try {
      localStorage.setItem("aura_active_view", view);
    } catch {}
  }, []);

  // Ensure scroll position resets to the top whenever active tab changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [activeView]);

  const isFirstMount = useRef(true);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("aura_sidebar_collapsed", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

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
  }, [isSidebarCollapsed]);

  // Clean ?entrance URL parameter from browser history on mount without re-triggering entrance animations
  useEffect(() => {
    if (searchParams.get("entrance") === "1") {
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {}
    }
  }, []);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("aura_active_view");
    } catch {}
    navigate("/login");
  }, [navigate]);

  const handleNavigateToDevice = useCallback(() => {
    handleViewChange("device");
  }, [handleViewChange]);

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
        onViewChange={handleViewChange}
        isEspOnline={dashboard.deviceStatus.online}
        onRefresh={dashboard.refreshData}
        isRefreshing={dashboard.isRefreshing}
        isEntrance={isEntrance}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
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
          onDeleteNotification={dashboard.deleteNotification}
        />

        {/* Scrollable View Canvas */}
        <main
          ref={mainContentRef}
          className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 transition-colors duration-200 bg-aura-bg"
        >
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

            {activeView === "analytics" && (
              <AnalyticsView dashboard={dashboard} />
            )}

            {activeView === "settings" && (
              <SettingsView dashboard={dashboard} onViewChange={handleViewChange} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
