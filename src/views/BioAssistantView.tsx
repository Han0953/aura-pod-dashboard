import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import gsap from "gsap";
import {
  Bot,
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

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: "msg-init",
        role: "assistant",
        content: isOnline
          ? `Halo! Aku **Bio-AI Assistant** AURA Pod. Aku terhubung langsung ke mikrokontroler ESP32 untuk bantu kamu memantau sensor fisik riil secara real-time.

Saat ini telemetri fisik aktif yang aku baca:
- **Suhu Kultur (DS18B20)**: **${currentTemp !== null ? `${currentTemp.toFixed(1)} °C` : "--"}**
- **Indeks Gas (MQ-135)**: **${currentGas !== null ? `${currentGas} Idx` : "--"}**
- **Status ESP32**: **Online**

Ada yang ingin kamu diskusikan atau tanyakan ke aku tentang kondisi bioreaktormu hari ini?`
          : `Halo! Aku **Bio-AI Assistant** AURA Pod. Saat ini mikrokontroler ESP32 terpantau **Offline**, sehingga sensor suhu DS18B20 dan gas MQ-135 belum aktif mengirimkan data telemetri riil.

Status Perangkat Keras:
- **Status ESP32**: **Offline (Tidak Terhubung)**
- **Sensor Suhu (DS18B20)**: **-- °C (Offline)**
- **Sensor Gas (MQ-135)**: **-- Idx (Offline)**

Silakan nyalakan atau hubungkan node ESP32 kamu ke jaringan Wi-Fi/Blynk agar aku bisa membaca dan menganalisis kondisi bioreaktormu secara real-time ya!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

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

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: isOnline
          ? `Percakapan sudah aku atur ulang ya. Telemetri riil terkini: **Suhu ${currentTemp !== null ? `${currentTemp.toFixed(1)} °C` : "--"}** (DS18B20) dan **Gas ${currentGas !== null ? `${currentGas} Idx` : "--"}** (MQ-135). Ada yang mau kamu tanyakan ke aku?`
          : `Percakapan sudah aku atur ulang. Saat ini ESP32 terpantau **Offline**. Hubungkan node ESP32 kamu agar aku bisa membaca data sensor fisik riil ya!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const isTempOptimal = currentTemp !== null && currentTemp >= 21.0 && currentTemp <= 28.5;
  const isGasOptimal = currentGas !== null && currentGas <= 200;

  return (
    <div ref={containerRef} className="space-y-6 pb-12">
      {/* ── 1. Header Block ── */}
      <div className="assistant-stagger-item flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-extrabold text-aura-text-primary tracking-tight">
              Bio-AI Assistant
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-aura-primary/15 text-aura-primary border border-aura-primary/30 flex items-center gap-1 shadow-glow">
              <Sparkles className="w-3 h-3 text-aura-primary" />
              Autonomous Telemetry Engine
            </span>
          </div>
          <p className="text-xs text-aura-text-secondary mt-1">
            Modul penganalisis kondisi fotobioreaktor berbasis telemetri sensor fisik riil secara otonom.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetChat}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-aura-surface hover:bg-aura-surface-subtle border border-aura-border text-aura-text-secondary hover:text-aura-text-primary transition-all cursor-pointer shadow-sm active:scale-95"
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
      <div className="assistant-stagger-item rounded-2xl bg-aura-surface border border-aura-border shadow-card overflow-hidden flex flex-col h-[560px]">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-xs shadow-sm",
                    isUser
                      ? "bg-aura-primary text-black border-aura-primary/50"
                      : "bg-aura-surface-subtle text-aura-primary border-aura-primary/30"
                  )}
                >
                  {isUser ? "U" : <Bot className="w-4 h-4" />}
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
              <div className="w-8 h-8 rounded-xl bg-aura-surface-subtle text-aura-primary border border-aura-primary/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-sm bg-aura-bg/80 border border-aura-border/80 text-xs text-aura-text-secondary flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-aura-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-aura-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-aura-primary animate-bounce" />
                </div>
                <span className="font-mono text-[11px]">Menganalisis telemetri sensor...</span>
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
              placeholder="Tanya kondisi bioreaktor atau rekomendasi kultur ke aku..."
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

  // Jika offline, laporkan secara jujur tanpa angka palsu
  if (!deviceOnline || temperature === null) {
    return `Saat ini mikrokontroler ESP32 terpantau Offline (belum terhubung ke jaringan Blynk).

Karena perangkat sedang offline, data sensor fisik suhu (DS18B20) dan gas (MQ-135) belum aktif mengirimkan pembacaan ke dashboard.

Silakan nyalakan node ESP32 kamu dan pastikan terhubung ke Wi-Fi agar aku bisa membaca kondisi bioreaktormu secara real-time ya!`;
  }

  const isTempOptimal = temperature >= 21.0 && temperature <= 28.5;
  const isGasOptimal = gasIndex !== null && gasIndex <= 200;

  if (q.includes("ph") || q.includes("dissolved oxygen") || q.includes("do") || q.includes("oksigen terlarut")) {
    return `Saat ini, modul sensor fisik yang aktif terhubung ke ESP32 AURA Pod adalah Sensor Suhu DS18B20 (${temperature.toFixed(1)} °C) dan Sensor Gas MQ-135 (${gasIndex} Idx).

Untuk parameter seperti pH dan Dissolved Oxygen (DO), saat ini masih dalam tahap integrasi modul riset & pengembangan (R&D) ya. Jadi aku fokuskan analisis telemetri ke kestabilan suhu dan kualitas udara headspace bioreaktor dulu.`;
  }

  if (q.includes("suhu") || q.includes("panas") || q.includes("dingin") || q.includes("temperature")) {
    return `Dari pembacaan sensor DS18B20, suhu kultur mikroganggang saat ini terbaca ${temperature.toFixed(1)} °C.

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

  return `Ini ringkasan kondisi fisik AURA Pod yang aku pantau saat ini:

1. Status Node ESP32: ${deviceOnline ? "Online & Terhubung" : "Offline"} (Uptime: ${uptime})
2. Suhu Kultur (DS18B20): ${temperature.toFixed(1)} °C — ${isTempOptimal ? "Optimal untuk mikroalga" : "Perlu perhatian termal"}
3. Indeks Gas (MQ-135): ${gasIndex} Idx — ${isGasOptimal ? "Kualitas udara headspace aman" : "Peningkatan gas terdeteksi"}

Catatan: Analisis ini murni membaca 2 sensor fisik aktif. Modul sensor lanjutan (pH/DO) saat ini masih dalam fase R&D ya.`;
}

export default BioAssistantView;
