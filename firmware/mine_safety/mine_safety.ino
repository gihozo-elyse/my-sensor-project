/*
 * Coal Mine Safety – sensor node firmware (ESP8266 NodeMCU)
 *
 * Reads an MQ135 (gas) and DHT22 (temperature/humidity), raises a local alarm
 * (LEDs, buzzer, LCD) and uploads readings to the dashboard every 10 seconds.
 *
 * The local alarm works even when Wi-Fi or the server is down.
 *
 * Setup: copy secrets.example.h to secrets.h and fill in your values.
 * Libraries: "DHT sensor library" (Adafruit), "LiquidCrystal I2C".
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <WiFiClientSecure.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#include "secrets.h"  // WIFI_SSID, WIFI_PASSWORD, SERVER_URL, API_KEY

// ---------------- Pins ----------------
#define BUZZER_PIN     14   // D5
#define RED_LED_PIN    0    // D3 (GPIO0). If your red LED is wired to D6, change this to 12.
#define GREEN_LED_PIN  13   // D7
#define DHT_PIN        2    // D4
#define MQ135_PIN      A0

#define DHT_TYPE DHT22

// ---------------- Thresholds ----------------
// Keep in sync with lib/thresholds.ts in the dashboard.
const int   GAS_WARN  = 400,  GAS_CRIT  = 800;   // raw ADC 0–1023
const float TEMP_WARN = 35.0, TEMP_CRIT = 40.0;  // °C
const float HUM_WARN  = 70.0, HUM_CRIT  = 90.0;  // %

// ---------------- Timing ----------------
const unsigned long READ_INTERVAL_MS   = 10000;
const unsigned long LCD_PAGE_MS        = 3000;
const unsigned long WIFI_RETRY_MS      = 15000;
const unsigned long WIFI_BOOT_WAIT_MS  = 20000;
const uint16_t      HTTP_TIMEOUT_MS    = 5000;

// ---------------- State ----------------
enum Level { SAFE = 0, WARNING = 1, CRITICAL = 2 };

LiquidCrystal_I2C lcd(0x27, 16, 2);
DHT dht(DHT_PIN, DHT_TYPE);

int   gasValue    = 0;
float temperature = NAN;
float humidity    = NAN;
bool  sensorOk    = false;
Level level       = SAFE;
String alarmText  = "";

int   lastHttpCode   = 0;
bool  everUploaded   = false;

unsigned long lastReadAt      = 0;
unsigned long lastLcdPageAt   = 0;
unsigned long lastWifiRetryAt = 0;
unsigned long lastBuzzAt      = 0;
uint8_t lcdPage = 0;
bool buzzerOn = false;

// ---------------- Helpers ----------------
Level levelFor(float v, float warn, float crit) {
  if (v > crit) return CRITICAL;
  if (v > warn) return WARNING;
  return SAFE;
}

Level worst(Level a, Level b) { return a > b ? a : b; }

void lcdLine(uint8_t row, const String& text) {
  lcd.setCursor(0, row);
  String t = text.substring(0, 16);
  while (t.length() < 16) t += ' ';   // overwrite instead of clear() to avoid flicker
  lcd.print(t);
}

// ---------------- Sensors ----------------
void readSensors() {
  gasValue    = analogRead(MQ135_PIN);
  humidity    = dht.readHumidity();
  temperature = dht.readTemperature();
  sensorOk    = !isnan(humidity) && !isnan(temperature);

  Serial.printf("[read] gas=%d temp=%.1f hum=%.1f %s\n",
                gasValue, temperature, humidity, sensorOk ? "" : "(DHT22 read failed)");
}

void evaluate() {
  Level g = levelFor(gasValue, GAS_WARN, GAS_CRIT);
  Level t = sensorOk ? levelFor(temperature, TEMP_WARN, TEMP_CRIT) : SAFE;
  Level h = sensorOk ? levelFor(humidity, HUM_WARN, HUM_CRIT) : SAFE;
  level = worst(g, worst(t, h));

  // Report the most severe problem first.
  if (g == level && g != SAFE)      alarmText = "HIGH GAS LEVEL";
  else if (t == level && t != SAFE) alarmText = "HIGH TEMP";
  else if (h == level && h != SAFE) alarmText = "HIGH HUMIDITY";
  else                              alarmText = "";
}

// ---------------- Outputs (non-blocking) ----------------
void updateAlarm() {
  unsigned long now = millis();

  if (level == SAFE) {
    digitalWrite(GREEN_LED_PIN, sensorOk ? HIGH : (now / 500) % 2);  // blink green on sensor error
    digitalWrite(RED_LED_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);
    buzzerOn = false;
    return;
  }

  digitalWrite(GREEN_LED_PIN, LOW);

  // Warning: steady red LED, short beep every 2 s.
  // Critical: flashing red LED, rapid beeping.
  unsigned long onMs  = level == CRITICAL ? 150 : 200;
  unsigned long offMs = level == CRITICAL ? 150 : 1800;

  if (level == CRITICAL) digitalWrite(RED_LED_PIN, (now / 150) % 2);
  else                   digitalWrite(RED_LED_PIN, HIGH);

  if (now - lastBuzzAt >= (buzzerOn ? onMs : offMs)) {
    buzzerOn = !buzzerOn;
    digitalWrite(BUZZER_PIN, buzzerOn ? HIGH : LOW);
    lastBuzzAt = now;
  }
}

void updateLcd() {
  unsigned long now = millis();
  if (now - lastLcdPageAt < LCD_PAGE_MS) return;
  lastLcdPageAt = now;

  if (level != SAFE) {
    // Alternate between the warning and the readings so values stay visible.
    if (lcdPage++ % 2 == 0) {
      lcdLine(0, level == CRITICAL ? "!!! CRITICAL !!!" : "!!! WARNING !!!");
      lcdLine(1, alarmText);
      return;
    }
  } else {
    lcdPage = (lcdPage + 1) % 2;
  }

  if (!sensorOk) {
    lcdLine(0, "Sensor Error!");
    lcdLine(1, "Check DHT22");
    return;
  }

  if (level != SAFE || lcdPage == 0) {
    lcdLine(0, "T:" + String(temperature, 1) + "C H:" + String(humidity, 0) + "%");
    lcdLine(1, "Gas:" + String(gasValue) + (level == SAFE ? "  SAFE" : ""));
  } else {
    if (WiFi.status() != WL_CONNECTED) {
      lcdLine(0, "WiFi: offline");
      lcdLine(1, "Retrying...");
    } else if (!everUploaded) {
      lcdLine(0, "WiFi connected");
      lcdLine(1, WiFi.localIP().toString());
    } else if (lastHttpCode >= 200 && lastHttpCode < 300) {
      lcdLine(0, "Data uploaded");
      lcdLine(1, "HTTP " + String(lastHttpCode));
    } else {
      lcdLine(0, "Upload failed");
      lcdLine(1, "Code " + String(lastHttpCode));
    }
  }
}

// ---------------- Network ----------------
void maintainWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  unsigned long now = millis();
  if (now - lastWifiRetryAt < WIFI_RETRY_MS) return;
  lastWifiRetryAt = now;
  Serial.println("[wifi] reconnecting...");
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void upload() {
  if (!sensorOk) {
    Serial.println("[http] skipped: invalid DHT22 reading");
    return;
  }
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[http] skipped: WiFi offline");
    return;
  }

  String url = SERVER_URL;
  HTTPClient http;
  WiFiClient plain;
  BearSSL::WiFiClientSecure secure;

  bool ok;
  if (url.startsWith("https://")) {
    secure.setInsecure();  // No certificate pinning; fine for a demo, pin the cert for production.
    ok = http.begin(secure, url);
  } else {
    ok = http.begin(plain, url);
  }
  if (!ok) {
    lastHttpCode = -1;
    return;
  }

  http.setTimeout(HTTP_TIMEOUT_MS);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);

  String body = String("{\"temperature\":") + String(temperature, 2) +
                ",\"humidity\":" + String(humidity, 2) +
                ",\"gas\":" + String(gasValue) + "}";

  lastHttpCode = http.POST(body);
  everUploaded = true;

  if (lastHttpCode > 0) {
    Serial.printf("[http] %d %s\n", lastHttpCode, http.getString().c_str());
  } else {
    Serial.printf("[http] error: %s\n", http.errorToString(lastHttpCode).c_str());
  }
  http.end();
}

// ---------------- Setup / loop ----------------
void setup() {
  Serial.begin(115200);
  Serial.println("\n==================================");
  Serial.println("  MINE SAFETY MONITORING SYSTEM");
  Serial.println("==================================");

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(GREEN_LED_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(RED_LED_PIN, LOW);
  digitalWrite(GREEN_LED_PIN, LOW);

  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcdLine(0, "MINE SAFETY");
  lcdLine(1, "SYSTEM START");

  dht.begin();

  WiFi.mode(WIFI_STA);
  WiFi.persistent(false);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Wait a limited time for Wi-Fi; carry on regardless so the local alarm still works.
  lcdLine(0, "Connecting WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < WIFI_BOOT_WAIT_MS) {
    lcdLine(1, "Please wait " + String((WIFI_BOOT_WAIT_MS - (millis() - start)) / 1000) + "s");
    delay(250);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[wifi] connected, IP ");
    Serial.println(WiFi.localIP());
    lcdLine(0, "WiFi Connected");
    lcdLine(1, WiFi.localIP().toString());
  } else {
    Serial.println("[wifi] not connected; running offline, will keep retrying");
    lcdLine(0, "WiFi offline");
    lcdLine(1, "Alarm still on");
  }
  lastWifiRetryAt = millis();
  lastLcdPageAt = millis();

  // Take the first reading straight away.
  lastReadAt = millis() - READ_INTERVAL_MS;
  Serial.println("SYSTEM READY");
}

void loop() {
  unsigned long now = millis();

  if (now - lastReadAt >= READ_INTERVAL_MS) {
    lastReadAt = now;
    readSensors();
    evaluate();
    upload();
  }

  maintainWifi();
  updateAlarm();
  updateLcd();
  delay(10);  // yield to the Wi-Fi stack
}
