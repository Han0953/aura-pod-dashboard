import React from "react";
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
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  dashboard,
  onNavigateToDevice,
}) => {
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
  } = dashboard;

  const isOffline = !deviceStatus.online;

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
    <div className="space-y-6 pb-12">
      {/* ROW 1: 3 Key Telemetry & Actuator Bento Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: DS18B20 Temperature */}
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

        {/* Card 2: MQ-135 Gas Index (Air Quality indication) */}
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

        {/* Card 3: Lighting Status */}
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
      </section>

      {/* ROW 2: Sensor Trends Chart & Hardware Nodes (8 / 4 Grid) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <SensorChart
            data={telemetryHistory}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            currentTemp={sensorData.temperature}
            currentGas={sensorData.gasIndex}
          />
        </div>

        <div className="lg:col-span-4 flex flex-col">
          <DeviceStatusCard
            deviceStatus={deviceStatus}
            onNavigateToDevice={onNavigateToDevice}
          />
        </div>
      </section>

      {/* ROW 3: MRV Biological Impact & Quick Actuator Controls */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <CarbonMetricCard carbon={carbonMetric} biomass={biomassMetric} />
        </div>

        <div className="lg:col-span-4 flex flex-col">
          <ActuatorControl
            ledOn={deviceStatus.led}
            aeratorOn={deviceStatus.aerator}
            onToggleLed={toggleLed}
            onToggleAerator={toggleAerator}
            disabled={isOffline}
          />
        </div>
      </section>
    </div>
  );
};
