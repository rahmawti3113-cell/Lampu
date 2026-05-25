import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

const cppCode = `/*
 * ESP32/ESP8266 - Kontrol 4 Relay & Sensor DHT11
 * Mendukung Telegram Bot + Web Server API Lokal (Fast Direct IP)
 */

#ifdef ESP32
  #include <WiFi.h>
  #include <WebServer.h>
#else
  #include <ESP8266WiFi.h>
  #include <ESP8266WebServer.h>
#endif

#include <WiFiClientSecure.h>
#include <UniversalTelegramBot.h>
#include <ArduinoJson.h>
#include <DHT.h>

const char* ssid     = "miki";
const char* password = "12345678";

#define BOTtoken  "YOUR_TELEGRAM_BOT_TOKEN"
#define CHAT_ID   "YOUR_CHAT_ID"

#ifdef ESP32
  const int relayPin[4] = {23, 19, 18, 5};
  WebServer server(80);
#else
  const int relayPin[4] = {D1, D2, D5, D6};
  ESP8266WebServer server(80);
#endif

String relayName[4] = {"Relay 1", "Relay 2", "Relay 3", "Relay 4"};
bool   relayState[4] = {false, false, false, false};

#ifdef ESP32
  #define DHTPIN 4
#else
  #define DHTPIN D7
#endif
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

#ifdef ESP8266
  X509List cert(TELEGRAM_CERTIFICATE_ROOT);
#endif
WiFiClientSecure client;
UniversalTelegramBot bot(BOTtoken, client);

int botRequestDelay = 1000;
unsigned long lastTimeBotRan;

int  variasiMode = 0;
int  variasiStep = 0;
unsigned long lastVariasiTime = 0;
const unsigned long VARIASI_DELAY = 50;
const int urutan1[4] = {0, 1, 2, 3};
const int urutan2[4] = {3, 2, 1, 0};

void setRelay(int index, bool state) {
  relayState[index] = state;
  digitalWrite(relayPin[index], state ? LOW : HIGH);
}

void allRelayOff() {
  for (int i = 0; i < 4; i++) setRelay(i, false);
}

void updateVariasi() {
  if (variasiMode == 0) return;
  if (millis() - lastVariasiTime >= VARIASI_DELAY) {
    lastVariasiTime = millis();
    allRelayOff();
    int targetRelay = (variasiMode == 1) ? urutan1[variasiStep] : urutan2[variasiStep];
    setRelay(targetRelay, true);
    variasiStep = (variasiStep + 1) % 4;
  }
}

// ==== WEB SERVER API HANDLERS ====

void addCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void handleOptions() {
  addCorsHeaders();
  server.send(204);
}

void handleGetStatus() {
  addCorsHeaders();
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  if (isnan(humidity)) humidity = 0;
  if (isnan(temperature)) temperature = 0;

  String json = "{";
  json += "\\"temperature\\":" + String(temperature) + ",";
  json += "\\"humidity\\":" + String(humidity) + ",";
  json += "\\"variasiMode\\":" + String(variasiMode) + ",";
  json += "\\"relays\\":[" + String(relayState[0]) + "," + String(relayState[1]) + "," + String(relayState[2]) + "," + String(relayState[3]) + "]";
  json += "}";
  server.send(200, "application/json", json);
}

void handleSetRelay() {
  addCorsHeaders();
  if (server.hasArg("id") && server.hasArg("state")) {
    int id = server.arg("id").toInt();
    bool state = server.arg("state").toInt() == 1;
    if (id >= 0 && id <= 3) {
      variasiMode = 0;
      setRelay(id, state);
      server.send(200, "application/json", "{\\"success\\":true}");
      return;
    }
  }
  server.send(400, "application/json", "{\\"error\\":\\"Invalid arguments\\"}");
}

void handleSetAll() {
  addCorsHeaders();
  if (server.hasArg("state")) {
    bool state = server.arg("state").toInt() == 1;
    variasiMode = 0;
    for(int i=0; i<4; i++) setRelay(i, state);
    server.send(200, "application/json", "{\\"success\\":true}");
    return;
  }
  server.send(400, "application/json", "{\\"error\\":\\"Invalid arguments\\"}");
}

void handleSetVariasi() {
  addCorsHeaders();
  if (server.hasArg("mode")) {
    int mode = server.arg("mode").toInt();
    variasiMode = mode;
    if(mode == 0) allRelayOff();
    server.send(200, "application/json", "{\\"success\\":true}");
    return;
  }
  server.send(400, "application/json", "{\\"error\\":\\"Invalid arguments\\"}");
}

void setupServer() {
  server.on("/api/status", HTTP_GET, handleGetStatus);
  server.on("/api/relay", HTTP_POST, handleSetRelay);
  server.on("/api/all", HTTP_POST, handleSetAll);
  server.on("/api/variasi", HTTP_POST, handleSetVariasi);
  server.onNotFound(handleOptions); // Handle CORS preflight & 404
  server.begin();
}

// =================================

// ... (Simpan sisa fungsi telegram kalian di sini)

void setup() {
  Serial.begin(115200);

  for (int i = 0; i < 4; i++) {
    pinMode(relayPin[i], OUTPUT);
    digitalWrite(relayPin[i], HIGH);
  }

  dht.begin();

  #ifdef ESP8266
    configTime(0, 0, "pool.ntp.org");
    client.setTrustAnchors(&cert);
  #endif

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  #ifdef ESP32
    client.setCACert(TELEGRAM_CERTIFICATE_ROOT);
  #endif

  Serial.print("Menghubungkan ke WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\n✅ WiFi Terhubung! IP: " + WiFi.localIP().toString());
  
  // Memulai Web Server
  setupServer();
  Serial.println("🌐 Web Server API berjalan pada port 80");
}

void loop() {
  updateVariasi();
  server.handleClient(); // PENTING: Menerima request dari Web/Direct IP

  if (millis() > lastTimeBotRan + botRequestDelay) {
    int numNewMessages = bot.getUpdates(bot.last_message_received + 1);
    while (numNewMessages) {
      // handleNewMessages(numNewMessages); // <-- Panggil fungsi telegram Anda
      numNewMessages = bot.getUpdates(bot.last_message_received + 1);
    }
    lastTimeBotRan = millis();
  }
}
`;

export function ESP32SetupCode() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(cppCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden">
      <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/60">
        <div>
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#E0E0E0]">ESP32 Web Server Code</h3>
          <p className="text-xs text-white/40 mt-1 font-mono">
            Direct IP access over local WiFi network.
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'COPIED' : 'COPY CODE'}
        </button>
      </div>
      <div className="p-0 bg-[#0A0B0D] overflow-x-auto max-h-[600px] custom-scrollbar">
        <pre className="p-6 text-xs text-cyan-500/80 font-mono">
          <code>{cppCode}</code>
        </pre>
      </div>
    </div>
  );
}
