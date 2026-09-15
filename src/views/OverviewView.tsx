import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { Thermometer, Wind, Sun } from "lucide-react";
import { SensorCard } from "@/components/sensors/SensorCard";
import { SensorChart } from "@/components/sensors/SensorChart";
import { DeviceStatusCard } from "@/components/device/DeviceStatusCard";
import { ActuatorControl } from "@/components/device/ActuatorControl";
import { CarbonMetricCard } from "@/components/mrv/CarbonMetricCard";
import { DashboardContextType } from "@/services/dashboardService";
import { SENSOR_THRESHOLDS } from "@/lib/constants";

interface OverviewViewProps {
  dashboard: DashboardContextType;
  onNavigateToDevice: () => void;
  isEntrance?: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  dashboard,
  onNavigateToDevice,
  isEntrance = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    sensorData,
    deviceStatus,
    carbonMetric,
    biomassMetric,
    telemetryHistory,
    timeRange,
    setTimeRange,
    toggleLed,
    toggleAerator,
    toggleMode,
  } = dashboard;

  const isOffline = !deviceStatus.online;

  // GSAP Dashboard Entrance Animation for each card item
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".dashboard-stagger-card",
        { opacity: 0, y: 32, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          stagger: 0.07,
          delay: isEntrance ? 0.35 : 0.05,
          ease: "power2.out",
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [isEntrance]);

  // Temperature status calculation
  const getTempStatus = () => {
    if (isOffline) return "offline";
    if (
      sensorData.temperature < SENSOR_THRESHOLDS.temperature.optimalMin ||
      sensorData.temperature > SENSOR_THRESHOLDS.temperature.optimalMax
    ) {
      return "warning";
    }
    return "normal";
  };

  // Gas index status calculation
  const getGasStatus = () => {
    if (isOffline) return "offline";
    if (sensorData.gasIndex === null) return "unavailable";
    if (sensorData.gasIndex > 200) return "warning";
    return "normal";
  };

  return (
    <div ref={containerRef} className="space-y-6 pb-12">
      {/* ROW 1: 3 Key Telemetry & Actuator Bento Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: DS18B20 Temperature */}
        <div className="dashboard-stagger-card">
          <SensorCard
            title="Culture Temperature"
            hardwareSensor="DS18B20 1-Wire"
            value={sensorData.temperature}
            unit="°C"
            status={getTempStatus()}
            icon={<Thermometer className="w-5 h-5 text-aura-primary" />}
            colorTheme="mint"
            sparkline="temp"
            offline={isOffline}
          />
        </div>

        {/* Card 2: MQ-135 Gas Index (Air Quality indication) */}
        <div className="dashboard-stagger-card">
          <SensorCard
            title="Gas Quality Index"
            hardwareSensor="MQ-135 Relative Idx"
            value={sensorData.gasIndex}
            unit="AQI"
            status={getGasStatus()}
            icon={<Wind className="w-5 h-5 text-aura-amber" />}
            colorTheme="amber"
            sparkline="gas"
            offline={isOffline}
          />
        </div>

        {/* Card 3: Lighting Status */}
        <div className="dashboard-stagger-card">
          <SensorCard
            title="Grow Light Status"
            hardwareSensor="Full Spectrum 660/450nm"
            value={deviceStatus.led ? "ON" : "OFF"}
            unit={deviceStatus.led ? "180 µmol" : ""}
            status={deviceStatus.led ? "active" : "inactive"}
            icon={<Sun className="w-5 h-5 text-aura-primary" />}
            colorTheme="mint"
            sparkline="none"
            offline={isOffline}
          />
        </div>
      </section>

      {/* ROW 2: Sensor Trends Chart & Quick Actuator Controls (8 / 4 Grid) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="dashboard-stagger-card lg:col-span-8">
          <SensorChart
            data={telemetryHistory}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            currentTemp={sensorData.temperature}
            currentGas={sensorData.gasIndex}
          />
        </div>

        <div className="dashboard-stagger-card lg:col-span-4 flex flex-col">
          <ActuatorControl
            ledOn={deviceStatus.led}
            aeratorOn={deviceStatus.aerator}
            onToggleLed={toggleLed}
            onToggleAerator={toggleAerator}
            mode={deviceStatus.mode}
            onToggleMode={toggleMode}
            disabled={isOffline}
          />
        </div>
      </section>

      {/* ROW 3: MRV Biological Impact & Device Status (8 / 4 Grid) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="dashboard-stagger-card lg:col-span-8">
          <CarbonMetricCard carbon={carbonMetric} biomass={biomassMetric} />
        </div>

        <div className="dashboard-stagger-card lg:col-span-4 flex flex-col">
          <DeviceStatusCard
            deviceStatus={deviceStatus}
            onNavigateToDevice={onNavigateToDevice}
          />
        </div>
      </section>
    </div>
  );
};
