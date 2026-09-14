---
name: AURA Pod Design System
description: Dark-mode native, eco-technological IoT dashboard system for microalgae photobioreactors and environmental monitoring.
colors:
  primary: "#00E599"
  primary-hover: "#00C985"
  secondary-cyan: "#38BDF8"
  secondary-amber: "#F59E0B"
  background: "#051310"
  surface: "#0A1915"
  surface-active: "#122B23"
  text-primary: "#FFFFFF"
  text-secondary: "#7D9B91"
  border: "#16332B"
  border-hover: "#224C40"
  success: "#00E599"
  warning: "#F59E0B"
  error: "#EF4444"
typography:
  h1:
    fontFamily: "Plus Jakarta Sans, Inter, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
  h2:
    fontFamily: "Plus Jakarta Sans, Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  metric-lg:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    fontFeatureSettings: "'tnum' on, 'cv05' on"
  body-md:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  "2xl": "32px"
components:
  card:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    borderWidth: "1px"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
  badge-pill:
    backgroundColor: "{colors.surface-active}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  toggle-active:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.full}"
    glow: "0 0 12px rgba(0, 229, 153, 0.35)"
---
## Overview
AURA Pod design system memadukan estetika bio-tech, kelestarian lingkungan, dan presisi perangkat IoT[cite: 2]. Ditujukan untuk monitoring bioreaktor mikroalga secara real-time dengan tampilan dark mode beraksen neon hijau mint yang nyaman di mata untuk monitoring jangka panjang[cite: 1, 2].
## Colors
- **Primary (#00E599):** Dipakai khusus untuk call-to-action, status normal/online, toggle aktif, data series utama, dan aksen brand[cite: 1, 2].
- **Secondary Cyan (#38BDF8):** Indikator metrik pH dan pembacaan level cairan[cite: 2].
- **Secondary Amber (#F59E0B):** Indikator gas index, ambang batas peringatan, dan grafik sekunder[cite: 1, 2].
- **Background (#051310):** Base canvas bernuansa deep teal-slate untuk menghindari fatigue akibat kontras murni `#000000`[cite: 1, 2].
- **Surface (#0A1915):** Kontainer modular bento grid[cite: 1, 2].
## Typography
Menggunakan geometric sans-serif (Plus Jakarta Sans untuk heading, Inter untuk metrik dan body text)[cite: 1, 2]. Seluruh angka metrik wajib mengaktifkan tabular figures (`font-variant-numeric: tabular-nums`) agar pergantian data telemetry tidak memicu horizontal shift[cite: 1].
## Spacing & Layout
Mengadopsi 8px grid system secara konsisten[cite: 1, 2]. Padding modul cards menggunakan 20px–24px, gap antar modul 16px, dan margin tepi 24px[cite: 1, 2]. Layout didesain berbasis modular bento grid desktop-first[cite: 1, 2].
## Shapes
Outer cards menggunakan border radius 16px (`rounded-2xl`)[cite: 2]. Nested elements seperti nav item menggunakan 8px (`rounded-lg`), sedangkan elemen status badge, pill selector, dan switch menggunakan `rounded-full` (9999px)[cite: 1, 2].
## Elevation & Depth
Menghindari drop shadow pekat bergaya skeuomorphic[cite: 1, 2]. Kedalaman visual dibangun via tonal layering (background `#051310` menuju surface `#0A1915`) yang dibatasi garis tepi 1px `#16332B`, dilengkapi aksen glow halus pada elemen aktif[cite: 1, 2].
## Components
- **Metric Cards:** Terdiri dari ikon modul, nama variabel, nilai metrik besar berformat tabular, SVG sparkline 30 hari/jam, status pill, dan range toleransi batas normal[cite: 1, 2].
- **Trend Chart:** Area visualisasi data multi-series dengan pill filter waktu snappable[cite: 2].
- **Device List:** Inventory list dengan dot status realtime hijau solid untuk menandai hardware sehat[cite: 2].
- **Quick Controls:** Tombol sakelar binary untuk aktuator fisik (aerator dan lampu tumbuh)[cite: 2].
## Rules to Never Break
- Dilarang mengganti warna latar utama menjadi hitam pekat (`#000000`) atau abu-abu netral tanpa rona hijau[cite: 1, 2].
- Seluruh teks body dan caption wajib lolos uji kontras minimum WCAG AA (≥4.5:1)[cite: 1, 2].
- Jangan gunakan border radius acak selain token 8px, 16px, dan 9999px[cite: 1, 2].
- Nilai angka metrik IoT tidak boleh memakai font condensed atau non-tabular[cite: 1].