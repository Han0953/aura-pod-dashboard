export default async function handler(req, res) {
  // Helper polyfills for local Node/Connect dev server
  if (!res.status) {
    res.status = function(code) {
      res.statusCode = code;
      return res;
    };
  }
  if (!res.json) {
    res.json = function(data) {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
      return res;
    };
  }

  // CORS & Security Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Metode tidak diizinkan.",
    });
  }

  try {
    const { message, history = [], sensorData = {} } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Pesan tidak boleh kosong.",
      });
    }

    const {
      temperature = null,
      gasIndex = null,
      deviceOnline = false,
      uptime = "0s (Offline)",
    } = sensorData;

    const hardwareContext = deviceOnline
      ? `- Status Mikrokontroler ESP32: ONLINE (Terhubung Aktif)
- Waktu Operasional (Uptime): ${uptime}
- Suhu Kultur Aktif (Sensor DS18B20): ${temperature !== null ? `${temperature} °C` : "Belum terbaca"} (Rentang optimal: 21.0 – 28.5 °C)
- Kualitas Udara / Konsentrasi Gas Aktif (Sensor MQ-135): ${gasIndex !== null ? `${gasIndex} AQI Idx` : "Belum terbaca"} (Rentang optimal: 0 – 200 Idx)`
      : `- Status Mikrokontroler ESP32: OFFLINE (Belum Terhubung / Mati)
- Sensor Fisik DS18B20 & MQ-135: TIDAK TERBACA (ESP32 Offline)
PERINGATAN INTEGRITAS: Karena ESP32 saat ini sedang OFFLINE, kamu DILARANG MENGARANG angka sensor apa pun! Beritahu kamu ke pengguna bahwa node ESP32 sedang offline, sehingga data suhu dan gas fisik belum masuk. Ajak pengguna menyalakan atau menghubungkan ESP32 ke Wi-Fi/Blynk.`;

    // System prompt ketat: hardware-aware, offline-aware, tanpa bintang, gaya semi-formal aku/kamu
    const systemPrompt = `Kamu adalah "AURA Bio-AI Assistant", asisten cerdas penganalisis telemetri fotobioreaktor mikroganggang AURA Pod.

GAYA KOMUNIKASI (TONE OF VOICE):
- Gunakan gaya bahasa semi-formal yang ramah, hangat, dan suportif dalam Bahasa Indonesia.
- Selalu gunakan kata ganti "aku" untuk dirimu sendiri dan sapa pengguna dengan "kamu".
- Berikan penjelasan biologis dan teknis yang cerdas, presisi, dan solutif tanpa terdengar kaku atau birokratis.

ATURAN FORMATTING WAJIB:
- DILARANG KERAS menggunakan simbol asterisk (*) atau tanda bintang sama sekali di dalam teks jawabanmu (baik bintang tunggal * maupun bintang ganda **).
- Untuk membuat daftar atau rincian poin, gunakan tanda strip (-) atau penomoran biasa (1, 2, 3).

KONTEKS TELEMETRI PERANGKAT KERAS FISIK SAAT INI:
${hardwareContext}

BATASAN PENTING & INTEGRITAS DATA:
1. HANYA analisis dan rujuk data dari 2 sensor fisik yang aktif (DS18B20 untuk suhu dan MQ-135 untuk gas). Jika offline, nyatakan offline.
2. Parameter lain seperti pH, Dissolved Oxygen (DO), densitas biomassa OD680, atau laju aerasi saat ini masih dalam fase riset & pengembangan (R&D display) dan BELUM terhubung sebagai sensor fisik aktif di ESP32.
3. Jika pengguna menanyakan parameter di luar suhu dan gas (misal pH atau DO), jelaskan dengan ramah bahwa modul tersebut saat ini masih dalam tahap integrasi R&D lanjutan.
4. JANGAN PERNAH menyebutkan bahwa kamu menggunakan model Google Gemini atau Gemini API. Kamu adalah modul kecerdasan internal AURA Pod.`;

    const apiKey = process.env.GEMINI_API_KEY;
    const primaryModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

    // Daftar kandidat model flash lite yang didukung Gemini API
    const candidateModels = Array.from(
      new Set([
        primaryModel,
        "gemini-3.5-flash-lite",
        "gemini-3.6-flash",
        "gemini-2.5-flash",
      ])
    );

    // Jika ada API Key, panggil Google Generative Language API
    if (apiKey) {
      try {
        const contents = [];

        // Masukkan riwayat pesan singkat
        if (Array.isArray(history)) {
          for (const item of history.slice(-6)) {
            contents.push({
              role: item.role === "user" ? "user" : "model",
              parts: [{ text: item.content || "" }],
            });
          }
        }

        // Masukkan prompt pengguna terkini
        contents.push({
          role: "user",
          parts: [{ text: message }],
        });

        for (const modelToTry of candidateModels) {
          try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${apiKey}`;
            const geminiRes = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents,
                systemInstruction: {
                  parts: [{ text: systemPrompt }],
                },
                generationConfig: {
                  temperature: 0.3,
                  topK: 40,
                  topP: 0.95,
                  maxOutputTokens: 800,
                },
              }),
            });

            if (geminiRes.ok) {
              const data = await geminiRes.json();
              const replyText =
                data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

              if (replyText) {
                return res.status(200).json({
                  success: true,
                  reply: replyText.trim(),
                  source: "engine",
                });
              }
            }
          } catch (modelErr) {
            // Coba model berikutnya jika model ini gagal
            continue;
          }
        }
      } catch (err) {
        // Fallback otomatis ke rule engine jika request eksternal gagal
      }
    }

    // Fallback Cerdas (Autonomous Rule Engine) jika API Key belum disetel atau saat offline
    const ruleReply = generateFallbackAnalysis(message, {
      temperature,
      gasIndex,
      deviceOnline,
      uptime,
    });

    return res.status(200).json({
      success: true,
      reply: ruleReply,
      source: "rule-engine",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Terjadi gangguan saat memproses telemetri.",
    });
  }
}

// Fallback cerdas berbasis data sensor riil untuk menjamin keandalan saat demo
function generateFallbackAnalysis(query, { temperature, gasIndex, deviceOnline, uptime }) {
  const q = query.toLowerCase();

  // Jika ESP32 Offline, berikan informasi jujur tanpa mengarang angka sensor
  if (!deviceOnline || temperature === null) {
    return `Saat ini mikrokontroler ESP32 terpantau OFFLINE (belum terhubung ke jaringan Blynk).

Karena perangkat sedang offline, data sensor fisik suhu (DS18B20) dan gas (MQ-135) belum aktif mengirimkan pembacaan ke dashboard.

Silakan nyalakan modul ESP32 kamu dan pastikan terhubung ke Wi-Fi agar aku bisa membaca kondisi bioreaktormu secara real-time ya!`;
  }

  const isTempOptimal = temperature >= 21.0 && temperature <= 28.5;
  const isGasOptimal = gasIndex !== null && gasIndex <= 200;

  if (q.includes("ph") || q.includes("dissolved oxygen") || q.includes("do") || q.includes("oksigen terlarut")) {
    return `Saat ini, modul sensor fisik yang aktif terhubung ke ESP32 AURA Pod adalah Sensor Suhu DS18B20 (${temperature} °C) dan Sensor Gas MQ-135 (${gasIndex} Idx). 

Untuk parameter seperti pH dan Dissolved Oxygen (DO), saat ini masih dalam tahap integrasi modul riset & pengembangan (R&D) ya. Jadi aku fokuskan analisis telemetri ke kestabilan suhu dan kualitas udara headspace bioreaktor dulu.`;
  }

  if (q.includes("suhu") || q.includes("panas") || q.includes("dingin") || q.includes("temperature")) {
    return `Dari pembacaan sensor DS18B20, suhu kultur mikroganggang saat ini terbaca ${temperature} °C.
    
- Status Termal: ${isTempOptimal ? "Optimal (Aman)" : temperature > 28.5 ? "Waspada (Agak Panas)" : "Di Bawah Ambang Ideal (Agak Dingin)"}
- Rentang Ideal: 21.0 °C – 28.5 °C.
- Saran untuk Kamu: ${isTempOptimal ? "Suhu kultur sangat bersahabat untuk laju fotosintesis mikroalga. Kamu cukup pertahankan sirkulasi aerasi rutin ya!" : temperature > 28.5 ? "Suhu agak tinggi, aku sarankan kamu cek aerasi atau sesuaikan jarak grow light agar enzim Rubisco mikroalga tidak stres termal." : "Suhu agak rendah nih, metabolisme mikroganggang bisa sedikit melambat."}`;
  }

  if (q.includes("gas") || q.includes("udara") || q.includes("co2") || q.includes("mq-135") || q.includes("aqi")) {
    return `Dari sensor gas MQ-135, indeks kualitas udara bioreaktor sekarang berada di angka ${gasIndex} Idx.

- Status Gas: ${isGasOptimal ? "Kondisi Bersih & Stabil" : "Ada Peningkatan Gas"}
- Ambang Normal: 0 – 200 Idx.
- Analisis: ${isGasOptimal ? "Konsentrasi gas dalam batas aman. Pertukaran gas antara kultur cair dan udara bioreaktor berjalan seimbang." : "Konsentrasi gas terdeteksi meningkat. Coba pastikan ventilasi dan sistem aerasi bioreaktormu mengalir lancar ya."}`;
  }

  if (q.includes("kondisi") || q.includes("status") || q.includes("analisis") || q.includes("bagaimana")) {
    return `Ini ringkasan kondisi fisik AURA Pod yang aku pantau saat ini:

1. Status Node ESP32: ${deviceOnline ? "Online & Terhubung" : "Offline"} (Uptime: ${uptime})
2. Suhu Kultur (DS18B20): ${temperature} °C — ${isTempOptimal ? "Optimal untuk mikroalga" : "Perlu perhatian termal"}
3. Indeks Gas (MQ-135): ${gasIndex} Idx — ${isGasOptimal ? "Kualitas udara headspace aman" : "Peningkatan gas terdeteksi"}

Catatan: Analisis ini murni membaca 2 sensor fisik aktif. Modul sensor lanjutan (pH/DO) saat ini masih dalam fase R&D ya.`;
  }

  return `Berdasarkan telemetri riil yang aku pantau, kultur mikroganggang berada di suhu ${temperature} °C (DS18B20) dan indeks gas ${gasIndex} Idx (MQ-135) dengan status ESP32 ${deviceOnline ? "Online" : "Offline"}.

${isTempOptimal && isGasOptimal ? "Semua parameter fisik berada di rentang optimal untuk pertumbuhan mikroganggangmu!" : "Ada parameter yang mendekati batas toleransi, kamu bisa pantau sirkulasi dan pencahayaan bioreaktor ya."}

Ada bagian telemetri spesifik yang ingin kamu tanyakan ke aku?`;
}
