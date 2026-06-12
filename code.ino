#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>



const char* ssid = "Assouman Rurangwa-2G";
const char* password = "R.Assouman@2026";


const char* serverName = "http://192.168.1.66:3000/api/sensor";


LiquidCrystal_I2C lcd(0x27, 16, 2);


#define BUZZER_PIN     14    // D5
#define RED_LED_PIN    0    // D6
#define GREEN_LED_PIN  13    // D7
#define DHT_PIN        2     // D4
#define MQ135_PIN      A0


#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);


const int GAS_THRESHOLD = 700;
const float TEMP_THRESHOLD = 32.0;
const int HUMIDITY_THRESHOLD = 80;


//VARIABLES

int gasValue = 0;
float temperature = 0;
float humidity = 0;

unsigned long lastReadingTime = 0;
const unsigned long readingInterval = 10000;


// SETUP

void setup() {

  Serial.begin(9600);
  delay(1000);

  Wire.begin();
  // Initialize LCD
  lcd.init();
  lcd.backlight();

  lcd.setCursor(0, 0);
  lcd.print("MINE SAFETY");
  lcd.setCursor(0, 1);
  lcd.print("SYSTEM START");
  delay(3000);
  lcd.clear();

  Serial.println("\n==================================");
  Serial.println(" MINE SAFETY MONITORING SYSTEM ");
  Serial.println("==================================");

  // Pin Modes
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(GREEN_LED_PIN, OUTPUT);

  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(RED_LED_PIN, LOW);
  digitalWrite(GREEN_LED_PIN, LOW);

  // Initialize DHT
  dht.begin();

  // CONNECT TO WIFI
  
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");

  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    
    lcd.setCursor(0, 1);
    lcd.print("Please Wait...");
  }

  Serial.println("\nWiFi Connected!");

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi Connected");
  lcd.setCursor(0, 1);
  lcd.print(WiFi.localIP());

  delay(3000);
  lcd.clear();

  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  Serial.println("SYSTEM READY!");
}


// MAIN LOOP

void loop() {

  if (millis() - lastReadingTime >= readingInterval) {

    lastReadingTime = millis();

    readSensors();

    checkConditions();

    displayOnLCD();

    sendDataToMongoDB();
  }
}


// READ SENSOR VALUES

void readSensors() {

  gasValue = analogRead(MQ135_PIN);

  humidity = dht.readHumidity();

  temperature = dht.readTemperature();

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" C");

  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");

  Serial.print("Gas Value: ");
  Serial.println(gasValue);
}


// LCD DISPLAY FUNCTION

void displayOnLCD() {

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("T:");
  lcd.print(temperature);
  lcd.print("C ");

  lcd.print("H:");
  lcd.print(humidity);

  lcd.setCursor(0, 1);
  lcd.print("Gas:");
  lcd.print(gasValue);

  delay(3000);
}


void checkConditions() {

  if (isnan(humidity) || isnan(temperature)) {

    handleSensorError();
    return;
  }

  bool alert = (
    gasValue > GAS_THRESHOLD ||
    temperature > TEMP_THRESHOLD ||
    humidity > HUMIDITY_THRESHOLD
  );

  if (alert) {

    digitalWrite(RED_LED_PIN, HIGH);
    digitalWrite(GREEN_LED_PIN, LOW);

    // Buzzer Alert
    digitalWrite(BUZZER_PIN, HIGH);
    delay(300);
    digitalWrite(BUZZER_PIN, LOW);

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("!!! WARNING !!!");

    if (gasValue > GAS_THRESHOLD) {
      lcd.setCursor(0, 1);
      lcd.print("HIGH GAS LEVEL");
    }
    else if (temperature > TEMP_THRESHOLD) {
      lcd.setCursor(0, 1);
      lcd.print("HIGH TEMP");
    }
    else if (humidity > HUMIDITY_THRESHOLD) {
      lcd.setCursor(0, 1);
      lcd.print("HIGH HUMIDITY");
    }

    delay(3000);

  } else {

    digitalWrite(RED_LED_PIN, LOW);
    digitalWrite(GREEN_LED_PIN, HIGH);
    digitalWrite(BUZZER_PIN, LOW);
  }
}


// SEND DATA TO MONGODB

void sendDataToMongoDB() {

  if (WiFi.status() == WL_CONNECTED) {

    WiFiClient client;
    HTTPClient http;

    http.begin(client, serverName);

    http.addHeader("Content-Type", "application/json");

    String jsonPayload =
      "{\"temperature\":" + String(temperature) +
      ",\"humidity\":" + String(humidity) +
      ",\"gas\":" + String(gasValue) + "}";

    Serial.print("Sending Data -> ");

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {

      Serial.print("Success: ");
      Serial.println(httpResponseCode);

      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Data Uploaded");
      lcd.setCursor(0, 1);
      lcd.print("HTTP:");
      lcd.print(httpResponseCode);

    } else {

      Serial.print("Error: ");
      Serial.println(httpResponseCode);

      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Upload Failed");
    }

    http.end();

    delay(2000);
  }
}


// SENSOR ERROR HANDLER

void handleSensorError() {

  digitalWrite(RED_LED_PIN, HIGH);
  digitalWrite(GREEN_LED_PIN, HIGH);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Sensor Error!");
  lcd.setCursor(0, 1);
  lcd.print("Check DHT22");

  delay(2000);

  digitalWrite(RED_LED_PIN, LOW);
  digitalWrite(GREEN_LED_PIN, LOW);
}