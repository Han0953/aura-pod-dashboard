import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { OverviewView } from "@/views/OverviewView";
import { MonitoringView } from "@/views/MonitoringView";
import { DeviceView } from "@/views/DeviceView";
import { useDashboardData } from "@/services/dashboardService";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ViewId } from "@/types/navigation";
import { cn } from "@/lib/utils";

function DashboardContent() {
  const [activeView, setActiveView] = useState<ViewId>("overview");
  const dashboard = useDashboardData();
  const { theme } = useTheme();

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
      {/* Fixed Left Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        isEspOnline={dashboard.deviceStatus.online}
        onToggleOnline={dashboard.toggleOnline}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar Header with the single toggle button */}
        <Topbar
          activeView={activeView}
          isEspOnline={dashboard.deviceStatus.online}
          lastUpdatedText={dashboard.lastUpdatedText}
          isRefreshing={dashboard.isRefreshing}
          onRefresh={dashboard.refreshData}
        />

        {/* Scrollable View Canvas */}
        <main className="flex-1 overflow-y-auto px-8 py-6 transition-colors duration-200 bg-aura-bg">
          <div className="max-w-7xl mx-auto">
            {activeView === "overview" && (
              <OverviewView
                dashboard={dashboard}
                onNavigateToDevice={handleNavigateToDevice}
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
}

export function App() {
  return (
    <ThemeProvider>
      <DashboardContent />
    </ThemeProvider>
  );
}

export default App;
