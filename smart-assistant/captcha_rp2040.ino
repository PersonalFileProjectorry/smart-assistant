/*
 * Smart Assistant - CAPTCHA Bot Detector
 * RP2040 Connect: 15초마다 4자리 난수를 MQTT로 발행
 * 
 * 필요 라이브러리:
 *   - WiFiNINA
 *   - PubSubClient
 *   - ArduinoJson
 * 
 * 동작:
 *   - 부팅 시 WiFi 연결
 *   - HiveMQ 공용 브로커에 접속
 *   - 15초마다 1000~9999 난수를 JSON으로 발행
 *   - LED로 발행 신호 표시
 */

#include <WiFiNINA.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ═══════════════════════════════════════════════
//   ★★★ 사용자 설정 영역 ★★★
// ═══════════════════════════════════════════════

// WiFi 설정 (2.4GHz 필수)
char ssid[] = "ECSL 2.4";       // WiFi 이름
char pass[] = "ecsl13204";       // WiFi 비밀번호

// MQTT 설정 (웹앱의 captcha.js와 동일해야 함!)
const char* MQTT_BROKER = "broker.hivemq.com";
const int   MQTT_PORT   = 1883;
const char* MQTT_TOPIC  = "smartassist-captcha-kr7f9a3b/number";
const char* CLIENT_ID   = "rp2040-captcha-7f9a3b";

// 발행 주기 (밀리초) - 10초 타이머 + 5초 여유
const unsigned long PUBLISH_INTERVAL = 15000;

// ═══════════════════════════════════════════════
//   전역 변수
// ═══════════════════════════════════════════════
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

unsigned long lastPublish = 0;
int currentRandom = 0;

// ═══════════════════════════════════════════════
//   WiFi 연결
// ═══════════════════════════════════════════════
void connectWiFi() {
    Serial.print("WiFi 연결 시도: ");
    Serial.println(ssid);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        WiFi.begin(ssid, pass);
        delay(3000);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println();
        Serial.print("[OK] WiFi 연결됨! IP: ");
        Serial.println(WiFi.localIP());
        Serial.print("     신호 강도(RSSI): ");
        Serial.print(WiFi.RSSI());
        Serial.println(" dBm");
    } else {
        Serial.println();
        Serial.println("[FAIL] WiFi 연결 실패. 재시도 예정.");
    }
}

// ═══════════════════════════════════════════════
//   MQTT 재연결
// ═══════════════════════════════════════════════
void reconnectMQTT() {
    while (!mqttClient.connected()) {
        Serial.print("MQTT 브로커 연결 시도... ");
        if (mqttClient.connect(CLIENT_ID)) {
            Serial.println("[OK] 연결 성공!");
        } else {
            Serial.print("[FAIL] rc=");
            Serial.print(mqttClient.state());
            Serial.println(" -> 5초 후 재시도");
            delay(5000);
        }
    }
}

// ═══════════════════════════════════════════════
//   난수 생성 + MQTT 발행
// ═══════════════════════════════════════════════
void publishRandomNumber() {
    // 1000~9999 사이 4자리 난수
    currentRandom = random(1000, 10000);

    // JSON 형식으로 발행
    StaticJsonDocument<128> doc;
    doc["number"] = currentRandom;
    doc["timestamp"] = millis();
    doc["ttl"] = 10;

    char buffer[128];
    size_t n = serializeJson(doc, buffer);

    if (mqttClient.publish(MQTT_TOPIC, buffer, n)) {
        Serial.print("[PUB] ");
        Serial.println(buffer);
    } else {
        Serial.println("[FAIL] 발행 실패");
    }
}

// ═══════════════════════════════════════════════
//   초기 설정
// ═══════════════════════════════════════════════
void setup() {
    Serial.begin(115200);
    delay(2000);

    Serial.println("\n===================================");
    Serial.println("  Smart Assistant CAPTCHA Publisher");
    Serial.println("  RP2040 Connect -> MQTT");
    Serial.println("===================================");

    // LED 핀 설정
    pinMode(LED_BUILTIN, OUTPUT);

    // 진짜 랜덤 시드
    randomSeed(analogRead(A0) + millis());

    // WiFi 연결
    connectWiFi();

    // MQTT 설정
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);

    Serial.print("브로커: ");
    Serial.print(MQTT_BROKER);
    Serial.print(":");
    Serial.println(MQTT_PORT);
    Serial.print("토픽: ");
    Serial.println(MQTT_TOPIC);
    Serial.print("발행 주기: ");
    Serial.print(PUBLISH_INTERVAL / 1000);
    Serial.println("초");
    Serial.println("===================================\n");
}

// ═══════════════════════════════════════════════
//   메인 루프
// ═══════════════════════════════════════════════
void loop() {
    // WiFi 재연결 체크
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[WARN] WiFi 끊김, 재연결...");
        connectWiFi();
    }

    // MQTT 재연결 체크
    if (!mqttClient.connected()) {
        reconnectMQTT();
    }
    mqttClient.loop();

    // 주기적 난수 발행
    unsigned long now = millis();
    if (now - lastPublish >= PUBLISH_INTERVAL) {
        lastPublish = now;
        publishRandomNumber();

        // LED 깜빡임 (발행 신호)
        digitalWrite(LED_BUILTIN, HIGH);
        delay(100);
        digitalWrite(LED_BUILTIN, LOW);
    }
}
