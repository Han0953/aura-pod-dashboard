# AURA Pod Blynk Integration

## Platform
Blynk IoT is the IoT platform for the MVP.

## Device
ESP32 is the main device connecting sensors and actuators.

## Sensors
- DS18B20: temperature.
- PH-4502C: pH, if retained in final hardware implementation.
- MQ-135: gas/air-quality indication.

## Actuators
- LED Grow Light.
- Aerator.

## Dashboard Data
- Temperature.
- pH.
- Gas Index.
- LED state.
- Aerator state.
- Device online/offline state.

## Virtual Pin Mapping
Final Virtual Pin numbers were not specified in the current project material and must remain TBD until firmware setup is final.

| Virtual Pin | Data | Direction | Status |
|---|---|---|---|
| TBD | Temperature | Device → Dashboard | TBD |
| TBD | pH | Device → Dashboard | TBD |
| TBD | Gas Index | Device → Dashboard | TBD |
| TBD | LED | Device ↔ Dashboard | TBD |
| TBD | Aerator | Device ↔ Dashboard | TBD |

## Rules
- Do not present MQ-135 as precise CO2 ppm without valid calibration.
- Use Gas Index or relative indication.
- Mock data is allowed for UI development only and must be labeled.
- Final mapping and update intervals follow the firmware implementation.
