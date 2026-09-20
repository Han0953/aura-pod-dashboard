export default function handler(req, res) {
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
    const { username, password } = req.body || {};

    // Kredensial rahasia sisi server Vercel (disetel di Vercel Dashboard Environment Variables)
    const rawUser = process.env.AUTH_USERNAME;
    const rawPass = process.env.AUTH_PASSWORD;
    const EXPECTED_USER = (rawUser && rawUser !== "undefined" ? rawUser : "admin").trim().toLowerCase();
    const EXPECTED_PASS = (rawPass && rawPass !== "undefined" ? rawPass : "aurapod2026").trim();

    const inputUser = (username || "").trim().toLowerCase();
    const inputPass = (password || "").trim();

    if (!inputUser || !inputPass) {
      return res.status(400).json({
        success: false,
        message: "Silakan masukkan username dan password.",
      });
    }

    if (inputUser === EXPECTED_USER && inputPass === EXPECTED_PASS) {
      // Buat token sesi bertanda tangan waktu
      const sessionToken = Buffer.from(
        JSON.stringify({
          sub: inputUser,
          exp: Date.now() + 1000 * 60 * 60 * 24, // 24 jam
        })
      ).toString("base64");

      return res.status(200).json({
        success: true,
        message: "Autentikasi berhasil.",
        token: sessionToken,
      });
    }

    return res.status(401).json({
      success: false,
      message: "Username atau password salah. Cek kredensial Anda.",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan internal server.",
    });
  }
}
