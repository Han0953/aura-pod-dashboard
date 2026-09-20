export default async function handler(req, res) {
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
      temperature = 25.4,
      gasIndex = 42,
      deviceOnline = true,
      uptime = "0h 0m 0s",
    } = sensorData;

    // System prompt ketat: hardware-aware, hanya sensor fisik riil, tanpa membocorkan nama API
    const systemPrompt = `Anda adalah "AURA Bio-AI Assistant", sistem kecerdasan telemetri otonom yang terintegrasi pada fotobioreaktor mikroganggang AURA Pod.

KONTEKS TELEMETRI PERANGKAT KERAS FISIK SAAT INI:
- Status Mikrokontroler ESP32: ${deviceOnline ? "ONLINE (Terhubung Aktif)" : "OFFLINE (Terputus)"}
- Waktu Operasional (Uptime): ${uptime}
- Suhu Kultur Aktif (Sensor DS18B20): ${temperature} °C (Rentang optimal kultivasi: 21.0 – 28.5 °C)
- Kualitas Udara / Konsentrasi Gas Aktif (Sensor MQ-135): ${gasIndex} AQI Idx (Rentang optimal: 0 – 200 Idx)

BATASAN PENTING & INTEGRITAS DATA:
1. HANYA analisis dan rujuk data dari 2 sensor fisik yang aktif di atas (DS18B20 untuk suhu dan MQ-135 untuk gas).
2. Parameter lain seperti pH, Dissolved Oxygen (DO), densitas biomassa OD680, atau laju aerasi saat ini masih dalam fase riset & pengembangan (R&D display) dan BELUM terhubung sebagai sensor fisik aktif di ESP32.
3. Jika pengguna menanyakan parameter di luar suhu dan gas (misal pH atau DO), jelaskan secara profesional bahwa parameter tersebut saat ini dalam tahap integrasi modul R&D lanjutan.
4. JANGAN PERNAH menyebutkan bahwa Anda menggunakan model Google Gemini atau Gemini API. Anda adalah modul kecerdasan internal AURA Pod.
5. Gunakan Bahasa Indonesia yang lugas, ilmiah, solutif, dan ramah untuk presentasi teknis fotobioreaktor.`;

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

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

        // Request ke endpoint model flash-lite
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
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

  const isTempOptimal = temperature >= 21.0 && temperature <= 28.5;
  const isGasOptimal = gasIndex <= 200;

  if (q.includes("ph") || q.includes("dissolved oxygen") || q.includes("do") || q.includes("oksigen terlarut")) {
    return `Saat ini, modul sensor fisik yang terpasang aktif pada ESP32 AURA Pod adalah **Sensor Suhu DS18B20** (${temperature} °C) dan **Sensor Gas MQ-135** (${gasIndex} Idx). 

Parameter seperti pH dan Dissolved Oxygen (DO) saat ini masih berada dalam **tahap integrasi modul riset & pengembangan (R&D)** sehingga belum membaca sensor fisik aktif. Analisis bioproses difokuskan pada stabilitas termal dan pertukaran gas kultur.`;
  }

  if (q.includes("suhu") || q.includes("panas") || q.includes("dingin") || q.includes("temperature")) {
    return `Berdasarkan pembacaan riil sensor **DS18B20**, suhu kultur mikroganggang saat ini adalah **${temperature} °C**.
    
- **Status Termal**: ${isTempOptimal ? "Optimal (Normal)" : temperature > 28.5 ? "Waspada Tinggi (Potensi Stres Termal)" : "Di Bawah Ambang Ideal"}
- **Ambang Batas Kultur**: 21.0 °C – 28.5 °C.
- **Rekomendasi**: ${isTempOptimal ? "Suhu kultur sangat ideal untuk mendukung laju fotosintesis mikroalga. Pertahankan aerasi reguler." : temperature > 28.5 ? "Disarankan mengaktifkan pendinginan pasif atau menyesuaikan intensitas grow light agar suhu tidak merusak enzim Rubisco." : "Suhu agak rendah, laju metabolisme mikroalga dapat melambat."}`;
  }

  if (q.includes("gas") || q.includes("udara") || q.includes("co2") || q.includes("mq-135") || q.includes("aqi")) {
    return `Berdasarkan pembacaan riil sensor gas **MQ-135**, indeks kualitas udara bioreaktor berada pada angka **${gasIndex} Idx**.

- **Status Gas**: ${isGasOptimal ? "Kondisi Bersih / Stabil" : "Peningkatan Gas Terdeteksi"}
- **Ambang Batas**: 0 – 200 Idx (Normal).
- **Analisis Biologis**: ${isGasOptimal ? "Konsentrasi gas berada dalam batas aman. Pertukaran gas antara fasa cair dan headspace bioreaktor berjalan seimbang." : "Terjadi peningkatan akumulasi gas. Pastikan sistem aerasi dan ventilasi headspace terbuka dengan baik."}`;
  }

  if (q.includes("kondisi") || q.includes("status") || q.includes("analisis") || q.includes("bagaimana")) {
    return `Berikut ringkasan analisis kondisi fisik AURA Pod saat ini:

1. **Konektivitas Node ESP32**: ${deviceOnline ? "Aktif & Terhubung" : "Offline"} (Uptime: ${uptime})
2. **Suhu Kultur (DS18B20)**: **${temperature} °C** &mdash; ${isTempOptimal ? "✅ Optimal untuk pertumbuhan mikroalga" : "⚠️ Perlu perhatian toleransi termal"}
3. **Indeks Gas (MQ-135)**: **${gasIndex} Idx** &mdash; ${isGasOptimal ? "✅ Kualitas udara headspace aman" : "⚠️ Peningkatan gas"}

*Catatan: Analisis ini murni menggunakan 2 sensor fisik aktif. Modul sensor lanjutan (pH/DO) saat ini dalam fase pengembangan lanjutan.*`;
  }

  return `Berdasarkan telemetri riil saat ini, kultur mikroganggang berada pada suhu **${temperature} °C** (Sensor DS18B20) dan indeks gas **${gasIndex} Idx** (Sensor MQ-135) dengan status ESP32 **${deviceOnline ? "Online" : "Offline"}**.

${isTempOptimal && isGasOptimal ? "Seluruh parameter fisik berada dalam rentang toleransi optimal untuk kultivasi mikroalga." : "Terdapat parameter yang mendekati ambang batas, disarankan untuk memantau sirkulasi dan pencahayaan bioreaktor."}

Ada aspek telemetri spesifik yang ingin Anda ketahui lebih lanjut?`;
}
