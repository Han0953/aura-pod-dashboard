import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import gsap from "gsap";
import {
  Send,
  Sparkles,
  Thermometer,
  Wind,
  Cpu,
  RotateCcw,
  Info,
  ShieldCheck,
} from "lucide-react";
import { DashboardContextType } from "@/services/dashboardService";
import { cn } from "@/lib/utils";

interface BioAssistantViewProps {
  dashboard: DashboardContextType;
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "Analisis kelayakan suhu & gas saat ini",
  "Apakah suhu kultur aman untuk mikroalga?",
  "Rekomendasi tindakan jika konsentrasi gas meningkat",
  "Jelaskan batasan operasional sensor DS18B20 & MQ-135",
];

// Helper untuk merender teks dengan mengubah markdown **kata** menjadi teks tebal rapi tanpa tanda bintang *
const FormattedMessageContent: React.FC<{ content: string; isUser: boolean }> = ({ content, isUser }) => {
  const lines = content.split("\n");

  const parseLine = (line: string, lineKey: string | number) => {
    // Membagi teks berdasarkan pola **teks**
    const parts = line.split(/(\*\*.*?\*\*)/g);

    return (
      <span key={lineKey}>
        {parts.map((part, index) => {
          if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
            const boldText = part.slice(2, -2).replace(/\*/g, "").trim();
            return (
              <strong
                key={index}
                className={cn(
                  "font-bold",
                  isUser ? "text-black underline decoration-black/30" : "text-aura-primary font-semibold"
                )}
              >
                {boldText}
              </strong>
            );
          }
          // Bersihkan seluruh karakter asterisk * tunggal yang mungkin tersisa
          const cleanPart = part.replace(/\*/g, "");
          return cleanPart;
        })}
      </span>
    );
  };

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Bullet point dengan tanda -, *, atau •
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
          const bulletContent = trimmed.replace(/^[-*•]\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-2 pl-0.5">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                  isUser ? "bg-black" : "bg-aura-primary shadow-glow"
                )}
              />
              <div className="flex-1">{parseLine(bulletContent, `bullet-${idx}`)}</div>
            </div>
          );
        }

        // Baris teks biasa
        return (
          <div key={idx} className="break-words">
            {parseLine(line, `line-${idx}`)}
          </div>
        );
      })}
    </div>
  );
};

export const BioAssistantView: React.FC<BioAssistantViewProps> = ({ dashboard }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sensorData, deviceStatus, diagnostics } = dashboard;
  const isOnline = deviceStatus?.online ?? false;
  // Jika offline, JANGAN gunakan nilai cadangan 42 atau 25.4 fiktif
  const currentTemp = isOnline ? (sensorData?.temperature ?? 0) : null;
  const currentGas = isOnline ? (sensorData?.gasIndex ?? null) : null;
  const uptime = isOnline ? (diagnostics?.uptime ?? "0h 0m 0s") : "0s (Offline)";

  const STORAGE_KEY = "aura_aira_chat_history";

  const createInitialMessage = (): ChatMessage => ({
    id: "msg-init",
    role: "assistant",
    content: isOnline
      ? `Halo! Kenalin, aku AIRA (AURA Intelligent Response Assistant). Senang bisa nemenin kamu memantau fotobioreaktor mikroganggang AURA Pod hari ini!

Saat ini telemetri fisik aktif yang aku pantau:
- Suhu Kultur (DS18B20): ${currentTemp !== null ? `${currentTemp.toFixed(1)} °C` : "--"}
- Indeks Gas (MQ-135): ${currentGas !== null ? `${currentGas} Idx` : "--"}
- Status ESP32: Online

Kira-kira ada yang mau kamu diskusikan atau tanyakan ke aku tentang kondisi kultur bioreaktormu hari ini?`
      : `Halo! Kenalin, aku AIRA (AURA Intelligent Response Assistant). Maaf ya, saat ini mikrokontroler ESP32 kamu terpantau sedang offline, sehingga sensor suhu DS18B20 dan gas MQ-135 belum aktif mengirimkan data telemetri riil.

Status Perangkat Keras:
- Status ESP32: Offline (Tidak Terhubung)
- Sensor Suhu (DS18B20): -- °C (Offline)
- Sensor Gas (MQ-135): -- Idx (Offline)

Coba kamu periksa atau nyalakan node ESP32 kamu dan sambungkan ke Wi-Fi ya, biar aku bisa langsung bantu pantau kondisi bioreaktormu secara real-time!`,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback jika localStorage diblokir atau error parsing
    }

    return [createInitialMessage()];
  });

  // Simpan riwayat chat ke localStorage secara otomatis setiap kali ada pesan baru
  useEffect(() => {
    try {
      if (messages.length > 0) {
        // Simpan 80 pesan terakhir agar performa browser tetap optimal
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-80)));
      }
    } catch {
      // Abaikan jika quota localStorage penuh atau browser dalam mode restricted
    }
  }, [messages]);

  const [inputPrompt, setInputPrompt] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // GSAP Entrance Animation
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".assistant-stagger-item",
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.08,
          ease: "power2.out",
          clearProps: "transform,opacity",
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isFirstChatScroll = useRef(true);

  // Auto-scroll to bottom of chat inside its own container (WITHOUT scrolling parent viewport)
  useEffect(() => {
    if (!chatScrollRef.current) return;
    if (isFirstChatScroll.current) {
      isFirstChatScroll.current = false;
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    } else {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isThinking]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isThinking) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt("");
    setIsThinking(true);

    try {
      // Panggil backend serverless Vercel
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          sensorData: {
            temperature: currentTemp,
            gasIndex: currentGas,
            deviceOnline: isOnline,
            uptime: uptime,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data?.reply || "Analisis telemetri selesai diproses.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error("Serverless API response error");
      }
    } catch {
      // Fallback lokal cerdas jika dijalankan offline di localhost
      const fallbackReply = generateLocalTelemetryAnalysis(query, currentTemp, currentGas, isOnline, uptime);
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleResetChat = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Abaikan jika ada pembatasan localStorage
    }

    setMessages([createInitialMessage()]);
  };

  const isTempOptimal = currentTemp !== null && currentTemp >= 21.0 && currentTemp <= 28.5;
  const isGasOptimal = currentGas !== null && currentGas <= 200;

  return (
    <div ref={containerRef} className="space-y-4 sm:space-y-6 pb-0 md:pb-12">
      {/* ── 1. Header Block ── */}
      <div className="assistant-stagger-item flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-aura-primary/40 shadow-glow bg-aura-surface-subtle">
              <img
                src="/aira.webp"
                alt="AIRA"
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            {/* Indikator Status Aktif Menyala untuk AIRA */}
            <span 
              className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center"
              title="AIRA Aktif & Siap Membantu"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-aura-surface shadow-[0_0_8px_#34d399]" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-heading font-extrabold text-aura-text-primary tracking-tight">
                AIRA
              </h1>
              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-aura-primary/15 text-aura-primary border border-aura-primary/30 flex items-center gap-1 shadow-glow">
                <Sparkles className="w-3 h-3 text-aura-primary" />
                AURA Intelligent Response Assistant
              </span>
            </div>
            <p className="text-xs text-aura-text-secondary mt-1">
              Pendamping cerdas fotobioreaktor berbasis telemetri sensor fisik riil secara otonom.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetChat}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-aura-surface hover:bg-aura-surface-subtle border border-aura-border text-aura-text-secondary hover:text-aura-text-primary transition-all cursor-pointer shadow-sm active:scale-95 self-start md:self-auto"
          title="Mulai Sesi Baru"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Atur Ulang Obrolan</span>
        </button>
      </div>

      {/* ── 2. Live Hardware Telemetry Context Bar ── */}
      <div className="assistant-stagger-item p-4 rounded-2xl bg-aura-surface border border-aura-border shadow-card backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-aura-text-primary">
            <ShieldCheck className="w-4 h-4 text-aura-primary" />
            <span>Konteks Pembacaan Sensor Fisik Riil</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-2xl">
            {/* Suhu DS18B20 */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-aura-bg/70 border border-aura-border/60">
              <div className="w-8 h-8 rounded-lg bg-aura-primary/10 border border-aura-primary/20 flex items-center justify-center text-aura-primary">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-aura-text-secondary block font-mono uppercase">
                  DS18B20 Suhu
                </span>
                <span className="text-sm font-heading font-bold text-aura-text-primary">
                  {isOnline && currentTemp !== null ? `${currentTemp.toFixed(1)} °C` : "-- °C"}
                </span>
                <span
                  className={cn(
                    "text-[9px] font-mono ml-1.5 px-1 py-0.2 rounded font-semibold",
                    !isOnline
                      ? "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                      : isTempOptimal
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  )}
                >
                  {!isOnline ? "Offline" : isTempOptimal ? "Optimal" : "Waspada"}
                </span>
              </div>
            </div>

            {/* Gas MQ-135 */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-aura-bg/70 border border-aura-border/60">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Wind className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-aura-text-secondary block font-mono uppercase">
                  MQ-135 Gas
                </span>
                <span className="text-sm font-heading font-bold text-aura-text-primary">
                  {isOnline && currentGas !== null ? `${currentGas} Idx` : "-- Idx"}
                </span>
                <span
                  className={cn(
                    "text-[9px] font-mono ml-1.5 px-1 py-0.2 rounded font-semibold",
                    !isOnline
                      ? "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                      : isGasOptimal
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  )}
                >
                  {!isOnline ? "Offline" : isGasOptimal ? "Stabil" : "Perhatian"}
                </span>
              </div>
            </div>

            {/* Node Status */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-aura-bg/70 border border-aura-border/60">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-aura-text-secondary block font-mono uppercase">
                  Node ESP32
                </span>
                <span className="text-xs font-semibold text-aura-text-primary flex items-center gap-1.5">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isOnline ? "bg-aura-primary shadow-glow" : "bg-red-500"
                    )}
                  />
                  {isOnline ? "Online" : "Offline"}
                </span>
                <span className="text-[10px] text-aura-text-secondary font-mono block">
                  Uptime: {uptime}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notice filter R&D */}
        <div className="mt-3 pt-3 border-t border-aura-border/40 flex items-center gap-2 text-[11px] text-aura-text-secondary font-mono">
          <Info className="w-3.5 h-3.5 text-aura-primary shrink-0" />
          <span>
            Analisis fokus pada sensor fisik aktif. Parameter R&D (seperti pH dan Dissolved Oxygen) dikecualikan dari inferensi aktif.
          </span>
        </div>
      </div>

      {/* ── 3. Chat Console Box ── */}
      <div className="assistant-stagger-item rounded-2xl bg-aura-surface border border-aura-border shadow-card overflow-hidden flex flex-col h-[500px] sm:h-[560px] md:h-[600px]">
        {/* Messages Container */}
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 max-w-3xl",
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-xs shadow-sm overflow-hidden",
                    isUser
                      ? "bg-aura-primary text-black font-bold border-aura-primary/50"
                      : "bg-aura-surface-subtle border-aura-primary/30"
                  )}
                >
                  {isUser ? (
                    "U"
                  ) : (
                    <img
                      src="/aira.webp"
                      alt="AIRA"
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>

                {/* Message Bubble */}
                <div className="flex flex-col gap-1 max-w-[85%]">
                  <div
                    className={cn(
                      "p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm",
                      isUser
                        ? "bg-aura-primary text-black font-medium rounded-tr-sm"
                        : "bg-aura-bg/80 border border-aura-border/80 text-aura-text-primary rounded-tl-sm backdrop-blur-sm"
                    )}
                  >
                    <FormattedMessageContent content={msg.content} isUser={isUser} />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] text-aura-text-secondary font-mono px-1",
                      isUser ? "text-right" : "text-left"
                    )}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Thinking Indicator */}
          {isThinking && (
            <div className="flex gap-3 max-w-md mr-auto animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl bg-aura-surface-subtle border border-aura-primary/40 flex items-center justify-center shrink-0 overflow-hidden shadow-glow">
                <img
                  src="/aira.webp"
                  alt="AIRA"
                  className="w-full h-full object-cover object-top animate-pulse"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-sm bg-aura-bg/80 border border-aura-border/80 text-xs text-aura-text-secondary flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-aura-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-aura-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-aura-primary animate-bounce" />
                </div>
                <span className="font-mono text-[11px]">AIRA sedang menganalisis telemetri sensor...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2.5 bg-aura-bg/50 border-t border-aura-border/50 overflow-x-auto flex items-center gap-2 shrink-0 scrollbar-none">
          <span className="text-[10px] font-mono uppercase text-aura-text-secondary shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-aura-primary" />
            Saran:
          </span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              disabled={isThinking}
              className="px-2.5 py-1 rounded-lg bg-aura-surface hover:bg-aura-surface-subtle border border-aura-border/70 text-[11px] text-aura-text-secondary hover:text-aura-text-primary whitespace-nowrap transition-all cursor-pointer shrink-0 active:scale-95 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-aura-surface border-t border-aura-border shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Tanya apa saja ke AIRA seputar bioreaktor kamu..."
              disabled={isThinking}
              className="flex-1 px-4 py-2.5 rounded-xl bg-aura-bg border border-aura-border text-sm text-aura-text-primary placeholder:text-aura-text-secondary/50 focus:outline-none focus:border-aura-primary focus:ring-1 focus:ring-aura-primary transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isThinking}
              className="p-2.5 rounded-xl bg-aura-primary text-black hover:bg-aura-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-glow shrink-0 active:scale-95"
              title="Kirim Pesan"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Fallback cerdas lokal saat diuji di laptop tanpa koneksi Vercel
function generateLocalTelemetryAnalysis(
  query: string,
  temperature: number | null,
  gasIndex: number | null,
  deviceOnline: boolean,
  uptime: string
): string {
  const q = query.toLowerCase();

  // Jika offline, laporkan secara jujur dan lembut tanpa angka palsu
  if (!deviceOnline || temperature === null) {
    return `Halo! Maaf ya, saat ini mikrokontroler ESP32 kamu terpantau sedang offline (belum terhubung ke jaringan Blynk).

Karena perangkatnya belum menyala atau belum tersambung, data sensor fisik suhu (DS18B20) dan gas (MQ-135) belum bisa aku baca nih.

Coba kamu periksa dan nyalakan modul ESP32-nya ya, lalu pastikan koneksi Wi-Fi sudah tersambung. Begitu online, aku bakal langsung bantu pantau kondisi bioreaktor kamu dengan senang hati!`;
  }

  const isTempOptimal = temperature >= 21.0 && temperature <= 28.5;
  const isGasOptimal = gasIndex !== null && gasIndex <= 200;

  if (q.includes("ph") || q.includes("dissolved oxygen") || q.includes("do") || q.includes("oksigen terlarut")) {
    return `Halo! Untuk saat ini, sensor fisik yang aktif dan terhubung ke ESP32 AURA Pod baru Sensor Suhu DS18B20 (${temperature.toFixed(1)} °C) dan Sensor Gas MQ-135 (${gasIndex} Idx) ya.

Kalau untuk parameter pH dan Dissolved Oxygen (DO), modulnya masih dalam tahap integrasi riset dan pengembangan (R&D) lanjutan. Jadi untuk sekarang, biar aku dampingi kamu fokus ke kestabilan suhu kultur dan kualitas udara bioreaktor dulu ya!`;
  }

  if (q.includes("suhu") || q.includes("panas") || q.includes("dingin") || q.includes("temperature")) {
    return `Biar aku bantu cek suhunya ya! Dari pembacaan sensor DS18B20, suhu kultur mikroganggang kamu saat ini berada di ${temperature.toFixed(1)} °C.

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

  return `Halo! Ini rangkuman kondisi fotobioreaktor AURA Pod yang baru saja aku pantau untuk kamu:

1. Status Perangkat ESP32: ${deviceOnline ? "Online & Terhubung Lancar" : "Offline"} (Waktu aktif: ${uptime})
2. Suhu Kultur (DS18B20): ${temperature.toFixed(1)} °C — ${isTempOptimal ? "Kondisi sangat optimal untuk pertumbuhan mikroalga" : "Perlu sedikit perhatian pada suhu"}
3. Indeks Gas (MQ-135): ${gasIndex} Idx — ${isGasOptimal ? "Kualitas udara headspace aman dan bersih" : "Terdeteksi sedikit peningkatan konsentrasi gas"}

Sebagai catatan, data ini murni dari sensor fisik riil ya. Modul sensor tambahan seperti pH dan DO masih dalam tahap pengembangan R&D. Ada hal lain yang mau kamu tanyakan ke aku?`;
}

export default BioAssistantView;
