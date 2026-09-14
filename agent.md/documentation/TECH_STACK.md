# AURA Pod Dashboard Technical Stack

## Frontend
- React
- TypeScript
- Vite

## Styling
- Tailwind CSS
- shadcn/ui

## Charts
- Recharts

## Icons
- Lucide React

## IoT
- Blynk IoT
- ESP32

## Package Manager
- npm

## Architecture
The frontend handles presentation, visualization, device status, and supported controls. Blynk handles device communication, sensor data, and device state.

## Constraints
- Do not replace Blynk with MQTT for MVP.
- Do not introduce Next.js unless explicitly required.
- Do not add a custom backend unless explicitly required.
- Prefer existing dependencies.
- Use TypeScript throughout the application.
- Keep abstractions simple and maintainable.
