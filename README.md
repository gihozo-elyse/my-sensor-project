# Coal Mine Safety Monitoring

This system monitors gas, temperature and humidity underground in real time. An **ESP8266** sensor node reads an MQ135 and a DHT22 and sounds a local alarm with LEDs, a buzzer and an LCD. It also uploads its readings to a **Next.js + MongoDB** dashboard, which shows live values, history charts and weekly reports, and sends push alerts.

```
ESP8266 (MQ135, DHT22) ──HTTP POST + X-API-Key──▶ /api/sensor ──▶ MongoDB
                                                      │
                          browser ◀── dashboard ◀─────┘  + web-push alerts on level changes
```

## Run the dashboard

1. Install the dependencies:
   ```bash
   npm install
   ```
2. Configure the environment:
   ```bash
   cp .env.example .env.local
   ```
   Then fill in `.env.local`:
   - `MONGODB_URI`: your MongoDB connection string.
   - `SESSION_SECRET`: generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
   - `SENSOR_API_KEY`: generate another random string the same way.
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`: optional, for push alerts. Create them with `npx web-push generate-vapid-keys`.
3. Start the server:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
   The `-H 0.0.0.0` flag lets the ESP8266 reach the server over your LAN.
4. Open http://localhost:3000 and create an account.

## Flash the sensor node

1. Copy `firmware/mine_safety/secrets.example.h` to `secrets.h` and fill in:
   - your Wi-Fi details
   - `SERVER_URL` (use your PC's LAN IP, for example `http://192.168.1.66:3000/api/sensor`)
   - `API_KEY` (the same value as `SENSOR_API_KEY`)
2. Open `firmware/mine_safety/mine_safety.ino` in the Arduino IDE.
3. Install the **DHT sensor library** and **LiquidCrystal I2C** libraries.
4. Select **NodeMCU 1.0** and upload.
5. Serial monitor: 115200 baud.

## Alert thresholds

| Metric | Warning above | Critical above |
| --- | --- | --- |
| Gas (MQ135, raw ADC 0–1023) | 400 | 800 |
| Temperature | 35 °C | 40 °C |
| Humidity | 70 % | 90 % |

The thresholds are defined in `lib/thresholds.ts` and mirrored at the top of the firmware sketch. Keep the two in sync.

## Project layout

```
app/                 pages (dashboard, sensors, alerts, reports, settings, help) + API routes
  api/sensor         POST readings (device, API key) · GET live data + bucketed history (signed-in users)
  api/auth           sign up / sign in / sign out (scrypt-hashed passwords, httpOnly session cookie)
  api/push-*         push subscription + test notification
components/          UI (app shell, cards, charts, live data provider)
lib/                 thresholds, MongoDB client, sessions, push, period grouping
firmware/            ESP8266 sketch
```
