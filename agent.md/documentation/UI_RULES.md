# AURA Pod Dashboard UI Rules

## General
- Prioritize readability and information hierarchy.
- Do not overcrowd the screen.
- Keep spacing consistent.
- Use subtle animation only.

## Realtime Data
- Update data without full page reload.
- Show last update when useful.
- Keep connection status visible.

## Loading
Use skeleton/loading states when data is not ready. Never silently substitute fake numbers.

## Empty
Use `No data` when unavailable and explain the reason if known.

## Error
Use understandable messages such as `Sensor unavailable` instead of exposing low-level exception text.

## Status Colors
- Green: normal/active/online.
- Cyan: information/IoT.
- Lime: biomass-related.
- Amber: warning.
- Red: error/critical.
- Muted: inactive/unavailable.

## Responsive
Desktop is the primary demo target. Keep tablet/mobile usable and prevent unintended horizontal overflow.

## Data Integrity
- Do not call Gas Index CO2 ppm.
- Do not label estimated carbon capture as measured capture.
- Mark mock/simulated values.

## Animation
Use animation for transitions, subtle hover, chart appearance, and device state changes. Avoid heavy parallax or looping effects that compete with data.
