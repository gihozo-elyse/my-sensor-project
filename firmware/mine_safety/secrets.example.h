// Copy this file to secrets.h (same folder) and fill in your values.
// secrets.h is git-ignored, so never commit real credentials.
#pragma once

#define WIFI_SSID     "your-2.4GHz-wifi-name"
#define WIFI_PASSWORD "your-wifi-password"

// Your computer's LAN IP (not localhost) + port, or your deployed https URL.
#define SERVER_URL    "http://192.168.1.66:3000/api/sensor"

// Must match SENSOR_API_KEY in the dashboard's .env.local
#define API_KEY       "paste-the-same-random-key-here"
