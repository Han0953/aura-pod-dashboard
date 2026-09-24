import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import gsap from "gsap";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { OverviewView } from "@/views/OverviewView";
import { MonitoringView } from "@/views/MonitoringView";
import { DeviceView } from "@/views/DeviceView";
import { AnalyticsView } from "@/views/AnalyticsView";
import { BioAssistantView } from "@/views/BioAssistantView";
import { SettingsView } from "@/views/SettingsView";
import { useDashboardData } from "@/services/dashboardService";
import { ViewId } from "@/types/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";

import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileDockBar } from "@/components/layout/MobileDockBar";
import { MobileSwipeContainer } from "@/components/layout/MobileSwipeContainer";

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
          saved === "assistant" ||
          saved === "settings")
      ) {
        return saved as ViewId;
      }
    } catch {}
    return "overview";
  });

  const mainContentRef = useRef<HTMLElement>(null);
  const mobileMainRef = useRef<HTMLElement>(null);

  const handleViewChange = useCallback((view: ViewId) => {
    setActiveView(view);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    if (mobileMainRef.current) {
      mobileMainRef.current.scrollTop = 0;
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
    if (mobileMainRef.current) {
      mobileMainRef.current.scrollTop = 0;
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

  // Verify authentication session
  useEffect(() => {
    try {
      const isAuth = sessionStorage.getItem("aura_authenticated") === "true";
      if (!isAuth) {
        navigate("/login", { replace: true });
      }
    } catch {
      // In case sessionStorage is blocked
    }
  }, [navigate]);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("aura_active_view");
      sessionStorage.removeItem("aura_authenticated");
    } catch {}
    navigate("/login");
  }, [navigate]);

  const handleNavigateToDevice = useCallback(() => {
    handleViewChange("device");
  }, [handleViewChange]);

  const isMobile = useIsMobile();

  const mobileViews = useMemo(() => {
    if (!isMobile) return [];
    return [
      {
        id: "overview" as ViewId,
        component: (
          <OverviewView
            dashboard={dashboard}
            onNavigateToDevice={handleNavigateToDevice}
            isEntrance={isEntrance}
          />
        ),
      },
      {
        id: "monitoring" as ViewId,
        component: <MonitoringView dashboard={dashboard} />,
      },
      {
        id: "device" as ViewId,
        component: <DeviceView dashboard={dashboard} />,
      },
      {
        id: "analytics" as ViewId,
        component: <AnalyticsView dashboard={dashboard} />,
      },
    ];
  }, [isMobile, dashboard, handleNavigateToDevice, isEntrance]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-aura-bg text-aura-text-primary">
      {/* ── DESKTOP MAIN CONTENT AREA (Hanya di-render di viewport Desktop >= 768px) ── */}
      {!isMobile && (
        <>
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

          <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
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

            {/* Scrollable View Canvas dengan Hardware Acceleration */}
            <main
              ref={mainContentRef}
              className="flex-1 overflow-y-auto gpu-scroll px-6 sm:px-8 py-6 bg-transparent"
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

                {activeView === "assistant" && (
                  <BioAssistantView dashboard={dashboard} />
                )}

                {activeView === "settings" && (
                  <SettingsView dashboard={dashboard} onViewChange={handleViewChange} />
                )}
              </div>
            </main>
          </div>
        </>
      )}

      {/* ── MOBILE APP LAYOUT WITH DOCK BAR & SWIPE CONTAINER (Hanya di-render di viewport Mobile < 768px) ── */}
      {isMobile && (
        <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden relative">
          <MobileHeader
            activeView={activeView}
            lastUpdatedText={dashboard.lastUpdatedText}
            isEspOnline={dashboard.deviceStatus.online}
            onRefresh={dashboard.refreshData}
            isRefreshing={dashboard.isRefreshing}
            notifications={dashboard.notifications}
            unreadNotificationCount={dashboard.unreadNotificationCount}
            onMarkAllAsRead={dashboard.markAllNotificationsAsRead}
            onClearAllNotifications={dashboard.clearAllNotifications}
            onDeleteNotification={dashboard.deleteNotification}
            onNavigateToSettings={() => handleViewChange("settings")}
            onLogout={handleLogout}
          />

          <main ref={mobileMainRef} className="flex-1 overflow-hidden pt-16 relative">
            {activeView === "assistant" ? (
              <div className="w-full h-full overflow-y-auto px-3 sm:px-4 pt-2 pb-24 touch-pan-y scrollbar-none">
                <BioAssistantView dashboard={dashboard} />
              </div>
            ) : activeView === "settings" ? (
              <div className="w-full h-full overflow-y-auto px-3 sm:px-4 pt-2 pb-24 touch-pan-y scrollbar-none">
                <SettingsView dashboard={dashboard} onViewChange={handleViewChange} />
              </div>
            ) : (
              <MobileSwipeContainer
                activeView={activeView}
                onViewChange={handleViewChange}
                views={mobileViews}
              />
            )}
          </main>

          <MobileDockBar
            activeView={activeView}
            onViewChange={handleViewChange}
          />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
