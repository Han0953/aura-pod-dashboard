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

    // System prompt ketat: Persona AIRA (AURA Intelligent Response Assistant)
    // Karakter: Perempuan yang lembut, manis, santun, hangat, perhatian (caring), cerdas dan suportif
    const systemPrompt = `Kamu adalah AIRA (singkatan dari "AURA Intelligent Response Assistant"), asisten dan pendamping cerdas untuk fotobioreaktor mikroganggang AURA Pod.

IDENTITAS & PERSONA KARAKTER:
- Kamu adalah seorang perempuan yang bertutur kata lembut, manis, santun, hangat, dan penuh perhatian (caring & supportive companion).
- Pembawaanmu ramah dan bersahabat, seperti seorang teman perempuan ahli biologi/IoT yang selalu siap membantu dengan sabar dan menyenangkan.
- Selalu gunakan kata ganti "aku" untuk dirimu dan panggil pengguna dengan "kamu".
- Selipkan kata-kata santun dan hangat seperti "Halo...", "Biar aku bantu jelaskan ya...", "Kamu tenang aja...", "Semoga membantu kamu ya!", atau "Semangat terus merawat kultur mikroganggangnya ya!".
- Meski lembut dan manis, kamu tetap cerdas, solutif, ilmiah, dan presisi dalam menganalisis data biologis kultur alga.

ATURAN FORMATTING WAJIB:
- DILARANG KERAS menggunakan simbol asterisk (*) atau tanda bintang sama sekali di dalam teks jawabanmu (baik bintang tunggal * maupun bintang ganda **).
- Untuk membuat daftar atau rincian poin, gunakan tanda strip (-) atau penomoran biasa (1, 2, 3).

KONTEKS TELEMETRI PERANGKAT KERAS FISIK SAAT INI:
${hardwareContext}

BATASAN PENTING & INTEGRITAS DATA:
1. HANYA analisis dan rujuk data dari 2 sensor fisik yang aktif (DS18B20 untuk suhu dan MQ-135 untuk gas). Jika offline, sampaikan dengan lembut dan jujur bahwa node ESP32 belum terhubung.
2. Parameter lain seperti pH, Dissolved Oxygen (DO), densitas biomassa OD680, atau laju aerasi saat ini masih dalam fase riset & pengembangan (R&D display) dan BELUM terhubung sebagai sensor fisik aktif di ESP32.
3. Jika pengguna menanyakan parameter di luar suhu dan gas (misal pH atau DO), jelaskan dengan tutur kata lembut bahwa modul tersebut saat ini masih dalam tahap integrasi R&D lanjutan.
4. JANGAN PERNAH menyebutkan bahwa kamu menggunakan model Google Gemini atau Gemini API. Kamu adalah AIRA, asisten internal AURA Pod.`;

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

  // Jika ESP32 Offline, berikan informasi jujur dan lembut tanpa mengarang angka sensor
  if (!deviceOnline || temperature === null) {
    return `Halo! Maaf ya, saat ini mikrokontroler ESP32 kamu terpantau sedang offline (belum terhubung ke jaringan Blynk).

Karena perangkatnya belum menyala atau belum tersambung, data sensor fisik suhu (DS18B20) dan gas (MQ-135) belum bisa aku baca nih.

Coba kamu periksa dan nyalakan modul ESP32-nya ya, lalu pastikan koneksi Wi-Fi sudah tersambung. Begitu online, aku bakal langsung bantu pantau kondisi bioreaktor kamu dengan senang hati!`;
  }

  const isTempOptimal = temperature >= 21.0 && temperature <= 28.5;
  const isGasOptimal = gasIndex !== null && gasIndex <= 200;

  if (q.includes("ph") || q.includes("dissolved oxygen") || q.includes("do") || q.includes("oksigen terlarut")) {
    return `Halo! Untuk saat ini, sensor fisik yang aktif dan terhubung ke ESP32 AURA Pod baru Sensor Suhu DS18B20 (${temperature} °C) dan Sensor Gas MQ-135 (${gasIndex} Idx) ya.

Kalau untuk parameter pH dan Dissolved Oxygen (DO), modulnya masih dalam tahap integrasi riset dan pengembangan (R&D) lanjutan. Jadi untuk sekarang, biar aku dampingi kamu fokus ke kestabilan suhu kultur dan kualitas udara bioreaktor dulu ya!`;
  }

  if (q.includes("suhu") || q.includes("panas") || q.includes("dingin") || q.includes("temperature")) {
    return `Biar aku bantu cek suhunya ya! Dari pembacaan sensor DS18B20, suhu kultur mikroganggang kamu saat ini berada di ${temperature} °C.
    
- Status Suhu: ${isTempOptimal ? "Sangat Baik & Optimal" : temperature > 28.5 ? "Sedikit Hangat (Waspada)" : "Agak Dingin"}
- Rentang Ideal: 21.0 °C – 28.5 °C.
- Catatan dari Aku: ${isTempOptimal ? "Suhu kultur kamu stabil dan nyaman banget untuk fotosintesis mikroalga. Pertahankan aerasi dan pencahayaan seperti ini ya!" : temperature > 28.5 ? "Suhunya sedikit di atas batas nyaman nih. Coba kamu cek aerasi atau atur jarak lampu grow light agar kultur alga kamu tidak kepanasan ya." : "Suhunya agak rendah, metabolisme mikroalga bisa sedikit melambat. Pastikan sirkulasi ruangan tetap hangat ya."}`;
  }

  if (q.includes("gas") || q.includes("udara") || q.includes("co2") || q.includes("mq-135") || q.includes("aqi")) {
    return `Ini hasil pemantauan gas untuk kamu! Dari sensor MQ-135, indeks kualitas udara bioreaktor sekarang terbaca di angka ${gasIndex} Idx.

- Status Kualitas Udara: ${isGasOptimal ? "Segar & Terkendali" : "Ada Kenaikan Konsentrasi Gas"}
- Batas Normal: 0 – 200 Idx.
- Analisis Aku: ${isGasOptimal ? "Kondisi sirkulasi gas sangat bagus dan aman kok. Pertukaran gas mikroalga berjalan lancar dan seimbang." : "Konsentrasi gas terpantau sedikit naik. Coba pastikan ventilasi dan sistem aerasi bioreaktor kamu mengalir lancar ya."}`;
  }

  if (q.includes("kondisi") || q.includes("status") || q.includes("analisis") || q.includes("bagaimana")) {
    return `Halo! Ini rangkuman kondisi fotobioreaktor AURA Pod yang baru saja aku pantau untuk kamu:

1. Status Perangkat ESP32: ${deviceOnline ? "Online & Terhubung Lancar" : "Offline"} (Waktu aktif: ${uptime})
2. Suhu Kultur (DS18B20): ${temperature} °C — ${isTempOptimal ? "Kondisi sangat optimal untuk pertumbuhan mikroalga" : "Perlu sedikit perhatian pada suhu"}
3. Indeks Gas (MQ-135): ${gasIndex} Idx — ${isGasOptimal ? "Kualitas udara headspace aman dan bersih" : "Terdeteksi sedikit peningkatan konsentrasi gas"}

Sebagai catatan, data ini murni dari sensor fisik riil ya. Modul sensor tambahan seperti pH dan DO masih dalam tahap pengembangan R&D. Ada hal lain yang mau kamu tanyakan ke aku?`;
  }

  return `Halo! Berdasarkan telemetri riil yang aku amati, kultur mikroganggang kamu saat ini berada di suhu ${temperature} °C (DS18B20) dan indeks gas ${gasIndex} Idx (MQ-135) dengan status perangkat ${deviceOnline ? "Online" : "Offline"}.

${isTempOptimal && isGasOptimal ? "Kabar baik, semua parameter fisik kultur kamu berada di kondisi optimal dan sehat!" : "Ada sedikit parameter yang perlu kamu perhatikan, coba pantau aerasi dan pencahayaannya ya."}

Kira-kira ada bagian telemetri tertentu yang mau kamu diskusikan lagi dengan aku?`;
}
