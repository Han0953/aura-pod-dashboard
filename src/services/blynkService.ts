/**
 * Blynk IoT Cloud Service for AURA Pod
 * Connects Web Dashboard to ESP32 via Blynk REST API (V0 - V4)
 */

const BLYNK_AUTH_TOKEN = import.meta.env.VITE_BLYNK_AUTH_TOKEN || "";
const BLYNK_SERVER_URL = import.meta.env.VITE_BLYNK_SERVER_URL || "https://blynk.cloud";

export interface BlynkTelemetryData {
  temperature: number;
  gasIndex: number;
  led: boolean;
  aerator: boolean;
  mode: "manual" | "iot";
}

export const blynkService = {
  /**
   * Cek apakah token Blynk sudah terkonfigurasi
   */
  isConfigured(): boolean {
    return Boolean(BLYNK_AUTH_TOKEN && BLYNK_AUTH_TOKEN !== "your_blynk_auth_token_here");
  },

  /**
   * Cek apakah hardware ESP32 sedang online/terkoneksi ke Blynk Cloud
   */
  async checkHardwareConnected(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const response = await fetch(
        `${BLYNK_SERVER_URL}/external/api/isHardwareConnected?token=${BLYNK_AUTH_TOKEN}`,
        { cache: "no-store" }
      );
      if (!response.ok) return false;
      const text = await response.text();
      return text.trim().toLowerCase() === "true";
    } catch {
      return false;
    }
  },

  /**
   * Ambil data telemetri dan status datastream V0 - V4 sekaligus
   */
  async fetchAllPins(): Promise<BlynkTelemetryData | null> {
    if (!this.isConfigured()) return null;
    try {
      const response = await fetch(
        `${BLYNK_SERVER_URL}/external/api/get?token=${BLYNK_AUTH_TOKEN}&v0&v1&v2&v3&v4`,
        { cache: "no-store" }
      );
      if (!response.ok) return null;
      const data = await response.json();

      const rawTemp = Number(data.v0);
      const rawGas = Number(data.v1);
      const rawLed = Number(data.v2);
      const rawAerator = Number(data.v3);
      const rawMode = Number(data.v4);

      return {
        temperature: !isNaN(rawTemp) ? Number(rawTemp.toFixed(1)) : 24.0,
        gasIndex: !isNaN(rawGas) ? Math.round(rawGas) : 0,
        led: rawLed === 1,
        aerator: rawAerator === 1,
        mode: rawMode === 1 ? "iot" : "manual",
      };
    } catch (err) {
      console.warn("[BlynkService] Error fetching pins:", err);
      return null;
    }
  },

  /**
   * Update virtual pin (V2 untuk LED, V3 untuk Aerator, V4 untuk Mode)
   */
  async updatePin(pin: "v2" | "v3" | "v4", value: number): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const response = await fetch(
        `${BLYNK_SERVER_URL}/external/api/update?token=${BLYNK_AUTH_TOKEN}&${pin}=${value}`,
        { method: "GET", cache: "no-store" }
      );
      return response.ok;
    } catch (err) {
      console.error(`[BlynkService] Error updating ${pin}:`, err);
      return false;
    }
  },
};
