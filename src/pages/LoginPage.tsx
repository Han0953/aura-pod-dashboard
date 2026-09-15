import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { Lock, User, ArrowRight, CheckCircle2, ShieldCheck, Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Animation Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const leftDoorRef = useRef<HTMLDivElement>(null);
  const rightDoorRef = useRef<HTMLDivElement>(null);
  const loginCardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Interactive Canvas: Photobioreactor Sine Waves & Bio-Particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Particle field
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 1,
      alpha: Math.random() * 0.6 + 0.2,
    }));

    let step = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse lerping
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // 3 Harmonic Bio-Flow Sine Waves
      step += 0.018;
      ctx.lineWidth = 1.5;

      const waveColors = [
        "rgba(0, 229, 153, 0.35)", // Mint neon
        "rgba(56, 189, 248, 0.25)", // Cyan
        "rgba(16, 185, 129, 0.20)", // Emerald
      ];

      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.strokeStyle = waveColors[j];

        for (let x = 0; x < width; x += 8) {
          const distToMouse = Math.abs(x - mouse.x);
          const mouseDistortion = Math.max(0, (1 - distToMouse / 220) * 18);

          const y =
            height / 2 +
            Math.sin(x * 0.007 + step + j) * (26 + j * 12) +
            Math.cos(x * 0.004 + step) * 16 +
            mouseDistortion;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Render Floating Bio-Particles with Mouse Push
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Repel from mouse cursor
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          const angle = Math.atan2(dy, dx);
          p.x -= Math.cos(angle) * 0.9;
          p.y -= Math.sin(angle) * 0.9;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 153, ${p.alpha})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // 2. Rolling Door Login Trigger (GSAP Cinematic Door Split)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isSuccess) return;

    setIsSubmitting(true);

    // Instant auth verification
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);

      const isMobile = window.innerWidth < 768;
      const tl = gsap.timeline({
        onComplete: () => {
          // Navigate cleanly to Dashboard page with entrance flag
          navigate("/dashboard?entrance=1");
        },
      });

      if (isMobile) {
        // Mobile sheet dismiss animation
        tl.to(loginCardRef.current, {
          y: 80,
          scale: 0.92,
          opacity: 0,
          duration: 0.5,
          ease: "power3.inOut",
        }).to(
          containerRef.current,
          {
            opacity: 0,
            duration: 0.35,
            ease: "power2.out",
          },
          "-=0.2"
        );
      } else {
        // Desktop Rolling Door Split
        tl.to(loginCardRef.current, {
          scale: 0.95,
          opacity: 0.8,
          duration: 0.2,
          ease: "power2.out",
        })
          .to(
            leftDoorRef.current,
            {
              xPercent: -100,
              duration: 0.85,
              ease: "power3.inOut",
            },
            "+=0.05"
          )
          .to(
            rightDoorRef.current,
            {
              xPercent: 100,
              duration: 0.85,
              ease: "power3.inOut",
            },
            "<" // simultaneous with left door
          );
      }
    }, 400);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-50 flex flex-col md:flex-row overflow-hidden bg-black select-none",
        theme === "dark" ? "dark" : "light"
      )}
    >
      {/* ── LEFT DOOR PANEL: AURA Pod Visual Identity & Interactive Bio-Canvas ── */}
      <div
        ref={leftDoorRef}
        className="hidden md:flex md:w-1/2 h-full relative bg-[#020705] border-r border-aura-border/40 flex-col justify-between p-12 overflow-hidden shrink-0 z-10 will-change-transform"
      >
        {/* Interactive Waves & Particles Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-auto" />

        {/* Ambient Glow Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-aura-primary/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-aura-cyan/15 rounded-full blur-[130px] pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-aura-surface border border-aura-primary/30 flex items-center justify-center p-2 shadow-glow">
            <img src="/aura-pod-logo.svg" alt="AURA Pod Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-white text-xl tracking-tight">
                AURA Pod
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-aura-primary/20 text-aura-primary border border-aura-primary/30">
                IoT Core
              </span>
            </div>
            <p className="text-xs text-aura-primary font-mono tracking-wider mt-1">
              Photobioreactor Cultivation Engine
            </p>
          </div>
        </div>

        {/* Center Visual Intro */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-aura-primary/10 border border-aura-primary/20 text-aura-primary mb-5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-aura-primary animate-ping" />
            Blynk Cloud & Telemetry System
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Microalgae Bio-Reactor <br />
            <span className="bg-gradient-to-r from-aura-primary via-emerald-300 to-aura-cyan bg-clip-text text-transparent">
              Monitoring & Control
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-4 max-w-md leading-relaxed">
            Portal telemetri presisi tinggi untuk pemantauan fotoperiode, sensor dissolved oxygen, pH,
            densitas biomassa, dan penghitungan tangkapan emisi karbon secara real-time.
          </p>
        </div>

        {/* Bottom Hardware Status Signal */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 font-mono pt-4 border-t border-white/10">
          <span className="flex items-center gap-2 text-aura-text-secondary">
            <span className="w-2 h-2 rounded-full bg-aura-primary shadow-glow" />
            ESP32 Node & Sensors Operational
          </span>
          <span className="text-slate-400">v2.4 &middot; Blynk IoT Protocol</span>
        </div>
      </div>

      {/* ── RIGHT DOOR PANEL: Authentication Form ── */}
      <div
        ref={rightDoorRef}
        className="w-full md:w-1/2 h-full min-h-[100dvh] relative bg-aura-bg flex flex-col justify-between p-6 sm:p-12 md:p-16 overflow-y-auto shrink-0 z-10 will-change-transform transition-colors duration-200"
      >
        {/* Top Bar: Mobile Brand + Theme Switcher */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex md:hidden items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aura-surface border border-aura-primary/30 flex items-center justify-center p-1.5 shadow-glow">
              <img src="/aura-pod-logo.svg" alt="AURA Pod" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-heading font-bold text-base text-aura-text-primary block">
                AURA Pod
              </span>
              <span className="text-[10px] text-aura-primary font-mono uppercase">
                IoT Dashboard
              </span>
            </div>
          </div>

          <span className="hidden md:inline-block text-xs font-mono uppercase tracking-widest text-aura-text-secondary">
            Authentication Gate
          </span>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-aura-surface hover:bg-aura-surface-subtle border border-aura-border text-aura-text-secondary hover:text-aura-text-primary transition-colors cursor-pointer"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-blue-500" />
            )}
          </button>
        </div>

        {/* Center Login Card Form */}
        <div ref={loginCardRef} className="max-w-md w-full mx-auto my-auto py-6">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-aura-surface border border-aura-border text-[11px] font-mono text-aura-text-secondary mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-aura-primary" />
              Secure Bioreactor Console
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-aura-text-primary tracking-tight">
              Selamat Datang Kembali
            </h2>
            <p className="text-xs sm:text-sm text-aura-text-secondary mt-2">
              Klik tombol masuk untuk mengakses panel kendali telemetri dan aktuator.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-aura-text-secondary block">
                Username Operator
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-aura-text-secondary">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-aura-surface border border-aura-border text-sm text-aura-text-primary placeholder:text-aura-text-secondary/50 focus:outline-none focus:border-aura-primary focus:ring-1 focus:ring-aura-primary transition-all font-mono"
                  placeholder="Username (opsional)"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-aura-text-secondary block">
                Kode Kunci Akses
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-aura-text-secondary">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-aura-surface border border-aura-border text-sm text-aura-text-primary placeholder:text-aura-text-secondary/50 focus:outline-none focus:border-aura-primary focus:ring-1 focus:ring-aura-primary transition-all font-mono"
                  placeholder="Password (opsional)"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className={cn(
                "w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg",
                isSuccess
                  ? "bg-emerald-600 text-white shadow-emerald-500/30 scale-[1.02]"
                  : "bg-aura-primary text-black hover:bg-aura-primary-hover shadow-glow hover:shadow-glow active:scale-[0.99]"
              )}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Akses Diterima &mdash; Membuka Dashboard...</span>
                </>
              ) : isSubmitting ? (
                <span>Memverifikasi Node...</span>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick Notice */}
          <div className="mt-6 p-3 rounded-xl bg-aura-surface/60 border border-aura-border/70 text-[11px] text-aura-text-secondary text-center">
            Mode cepat aktif: langsung klik <strong className="text-aura-primary">"Masuk ke Dashboard"</strong> untuk menyaksikan transisi sinematik.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-aura-text-secondary font-mono pt-4 border-t border-aura-border/60">
          <span>&copy; 2026 AURA Pod System</span>
          <span>Security Level: Standard</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
