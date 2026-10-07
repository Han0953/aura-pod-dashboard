/*
 * ============================================================================
 * Project      : AURA Pod - Blynk IoT Integration
 * Board        : ESP32 NodeMCU 38-Pin DevKit
 * Relay Logic  : Active HIGH (GPIO 18 & 19)
 * Display      : OLED 0.96" I2C Yellow-Blue (128x64)
 * Datastreams  :
 *   - V0 : Suhu DS18B20 (Double / Float)
 *   - V1 : Gas Index Raw MQ-135 (Integer)
 *   - V2 : Switch LED Grow Light (Integer 0/1)
 *   - V3 : Switch Aerator (Integer 0/1)
 *   - V4 : Switch Mode: 0 = Manual, 1 = IoT/Auto (Integer 0/1)
 * ============================================================================
 */

// 1. DEFINISI BLYNK (Wajib di paling atas sebelum include Blynk)
#define BLYNK_TEMPLATE_ID "TMPL6VbNOoQBN" //ganti template id
#define BLYNK_TEMPLATE_NAME "AURA Pod" //ganti template name
#define BLYNK_AUTH_TOKEN "a8VJ8BKhbsZoz97GQivZaTY90qm95YW3" //ganti token

#include <WiFi.h>
#include <WiFiClient.h>
#include <BlynkSimpleEsp32.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ---------------------- KREDENSIAL WI-FI ---------------------
char ssid[] = "Samsung A56";
char pass[] = "zxcvbnm1";

// ---------------------- PIN DEFINITIONS ----------------------
#define PIN_DS18B20 4     // 1-Wire Suhu (Pull-up 4.7k ke 3.3V)[cite: 1]
#define PIN_MQ135 34      // Gas ADC1 (Voltage divider 10k & 15k)[cite: 1]
#define PIN_RELAY_LED 18  // Relay CH1 (LED Grow Light)[cite: 1]
#define PIN_RELAY_AER 19  // Relay CH2 (Aerator)[cite: 1]

// ---------------------- RELAY LOGIC --------------------------
#define RELAY_LED_ON LOW  // Active LOW untuk LED Grow Light
#define RELAY_LED_OFF HIGH

#define RELAY_AER_ON HIGH  // Active HIGH untuk Aerator
#define RELAY_AER_OFF LOW

// ---------------------- OLED DISPLAY (MONO BLUE) -------------
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ---------------------- OBJECTS & TIMERS ---------------------
OneWire oneWire(PIN_DS18B20);
DallasTemperature sensors(&oneWire);
BlynkTimer timer;

// ---------------------- SYSTEM STATES ------------------------
bool isIotMode = true;        // true = Auto [A], false = Manual [M]
bool isNetConnected = false;  // Status koneksi cloud
bool ledStatus = true;        // Default nyala untuk kultur
bool aeratorStatus = true;    // Default nyala untuk kultur
float currentTemp = 0.0;

// Variabel MQ-135 (Terpisah & Full Dynamic Range 12-Bit)
int rawADC_MQ135 = 0;           // RAW ADC murni (0 - 4095)
float headspaceGasIndex = 0.0;  // Headspace Gas Index (MQ-135)

// =============================================================
// HELPER FUNCTIONS AKTUATOR
// =============================================================
void setLed(bool state) {
  ledStatus = state;
  digitalWrite(PIN_RELAY_LED, state ? RELAY_LED_ON : RELAY_LED_OFF);
}

void setAerator(bool state) {
  aeratorStatus = state;
  digitalWrite(PIN_RELAY_AER, state ? RELAY_AER_ON : RELAY_AER_OFF);
}

// =============================================================
// BLYNK HANDLERS
// =============================================================
BLYNK_CONNECTED() {
  Serial.println("\n[BLYNK] Terhubung ke Cloud! Sinkronisasi data...");
  Blynk.syncVirtual(V4);
  Blynk.syncVirtual(V2);
  Blynk.syncVirtual(V3);
}

// V4: Mode Selector (0 = Manual [M], 1 = Auto [A])
BLYNK_WRITE(V4) {
  isIotMode = (param.asInt() == 1);
  if (isIotMode) {
    setLed(true);
    setAerator(true);
    Blynk.virtualWrite(V2, 1);
    Blynk.virtualWrite(V3, 1);
  }
}

// V2: Manual LED
BLYNK_WRITE(V2) {
  if (!isIotMode) {
    setLed(param.asInt() == 1);
  } else {
    Blynk.virtualWrite(V2, ledStatus ? 1 : 0);
  }
}

// V3: Manual Aerator
BLYNK_WRITE(V3) {
  if (!isIotMode) {
    setAerator(param.asInt() == 1);
  } else {
    Blynk.virtualWrite(V3, aeratorStatus ? 1 : 0);
  }
}

// =============================================================
// HYBRID NETWORK CHECKER (Non-Blocking)
// =============================================================
void checkNetwork() {
  if (WiFi.status() == WL_CONNECTED) {
    if (!Blynk.connected()) {
      Blynk.connect(1000);
    }
  } else {
    WiFi.reconnect();
  }

  isNetConnected = Blynk.connected();

  // Jika offline, fallback ke mode Auto [A] dan hidupkan aktuator
  if (!isNetConnected) {
    isIotMode = true;
    setLed(true);
    setAerator(true);
  }
}

// =============================================================
// PERIODIC DATA TASK (Tiap 1 Detik)
// =============================================================
void processSystemData() {
  // 1. Baca DS18B20
  sensors.requestTemperatures();
  currentTemp = sensors.getTempCByIndex(0);

  // 2. Baca MQ-135 RAW ADC (Averaging 10 sample tanpa filtering artifisial)
  long gasSum = 0;
  for (int i = 0; i < 10; i++) {
    gasSum += analogRead(PIN_MQ135);
    delayMicroseconds(100);
  }
  rawADC_MQ135 = (int)(gasSum / 10);  // Nilai riil 0 - 4095

  // 3. Hitung Headspace Gas Index (MQ-135) secara proporsional terhadap rentang ADC 12-bit
  // TIDAK menggunakan map() atau constrain() yang memotong di angka 1000
  headspaceGasIndex = ((float)rawADC_MQ135 / 4095.0) * 1000.0;

  // 4. Kirim ke Blynk jika sedang online
  if (isNetConnected) {
    if (currentTemp != DEVICE_DISCONNECTED_C) {
      Blynk.virtualWrite(V0, currentTemp);
    }
    // Kirim Headspace Gas Index hasil perhitungan (V1)
    Blynk.virtualWrite(V1, headspaceGasIndex);
  }

  // 5. Update Layar OLED
  updateOLED();

  // 6. Debug Serial Monitor Lengkap
  Serial.println("--------------------------------------------------");
  Serial.printf("[DEBUG] MQ-135 RAW                  : %d (Range: 0-4095)\n", rawADC_MQ135);
  Serial.printf("[DEBUG] Headspace Gas Index (MQ-135): %.2f\n", headspaceGasIndex);
  Serial.printf("[SYS]   NET: %s | Mode: %s | Temp: %.1f C | LED: %s | AER: %s\n",
                isNetConnected ? "ON" : "OFF",
                isIotMode ? "A" : "M",
                currentTemp,
                ledStatus ? "ON" : "OFF",
                aeratorStatus ? "ON" : "OFF");
}

// =============================================================
// OLED DISPLAY (Layout Single Color Blue)
// =============================================================
void updateOLED() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  // --- HEADER ---
  display.setCursor(0, 2);
  display.print("AURA");

  display.setCursor(48, 2);
  display.print(isIotMode ? "[A]" : "[M]");

  display.setCursor(76, 2);
  display.print(isNetConnected ? "NET:ON" : "NET:OFF");

  display.drawFastHLine(0, 13, 128, SSD1306_WHITE);

  // --- BODY ---
  // Baris 1: Suhu
  display.setCursor(0, 17);
  display.print("Temp : ");
  if (currentTemp == DEVICE_DISCONNECTED_C) {
    display.println("ERR (-127)");
  } else {
    display.print(currentTemp, 1);
    display.print(" ");
    display.write(247);
    display.println("C");
  }

  // Baris 2: MQ-135 RAW ADC
  display.setCursor(0, 29);
  display.print("RAW  : ");
  display.print(rawADC_MQ135);
  display.println(" / 4095");

  // Baris 3: Headspace Gas Index (Hasil Perhitungan)
  display.setCursor(0, 41);
  display.print("Index: ");
  display.print(headspaceGasIndex, 1);

  // Baris 4: Status Aktuator
  display.setCursor(0, 53);
  display.print("LED  : ");
  display.print(ledStatus ? "ON " : "OFF");
  display.print("| AER: ");
  display.println(aeratorStatus ? "ON" : "OFF");

  display.display();
}

// =============================================================
// SETUP
// =============================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  // 1. Setup Relay
  pinMode(PIN_RELAY_LED, OUTPUT);
  pinMode(PIN_RELAY_AER, OUTPUT);
  setLed(true);
  setAerator(true);

  // 2. Setup ADC MQ-135 & Sensor DS18B20
  analogReadResolution(12);  // Pastikan resolusi 12-bit aktif (0 - 4095)
  sensors.begin();

  // 3. Setup OLED
  if (display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.drawRect(0, 0, 128, 64, SSD1306_WHITE);
    display.setCursor(18, 18);
    display.println("AURA POD SYSTEM");
    display.drawFastHLine(20, 32, 88, SSD1306_WHITE);
    display.setCursor(22, 40);
    display.println("Starting Hybrid...");
    display.display();
  }

  // 4. Inisialisasi Jaringan Non-Blocking
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, pass);
  Blynk.config(BLYNK_AUTH_TOKEN);

  // 5. Setup Timers
  timer.setInterval(1000L, processSystemData);
  timer.setInterval(5000L, checkNetwork);

  Serial.println("\n[INIT] AURA Pod MQ-135 Calibrated Routine Ready!");
}

// =============================================================
// MAIN LOOP
// =============================================================
void loop() {
  if (isNetConnected) {
    Blynk.run();
  }
  timer.run();
}
