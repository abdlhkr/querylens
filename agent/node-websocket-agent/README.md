# Node.js WebSocket Test Agent

Gateway service üzerinden WebSocket bağlantısı kuran, registration ID kullanarak cihaz kimlik doğrulaması yapan ve bağlantı testleri gerçekleştiren bir Node.js agent'ı.

## 🚀 Kurulum

```bash
# Proje dizinine git
cd node-websocket-agent

# Bağımlılıkları yükle
npm install

# .env dosyasını düzenle
cp .env.example .env
# .env dosyasını düzenleyerek kendi değerlerini gir
```

## ⚙️ Konfigürasyon

`.env` dosyasını düzenleyerek aşağıdaki değerleri ayarlayın:

```env
# Gateway Bağlantı
GATEWAY_HTTP_URL=http://localhost:8080
GATEWAY_WS_URL=ws://localhost:8080

# Kimlik Bilgileri
AUTH_EMAIL=test@example.com
AUTH_PASSWORD=yourpassword
REGISTRY_ID=your-registry-id-here

# WebSocket Ayarları
WS_PATH=/ws/device
RECONNECT_INTERVAL=5000
MAX_RECONNECT_ATTEMPTS=10
PING_INTERVAL=30000
CONNECTION_TIMEOUT=10000

# Loglama
LOG_LEVEL=debug
LOG_FILE=./logs/agent.log
```

## 🎯 Kullanım

### Agent'ı Başlatma

```bash
# Normal mod
npm start

# Geliştirme modu (auto-reload)
npm run dev
```

### Testleri Çalıştırma

```bash
# Bağlantı testleri
npm test

# Veya ayrı ayrı
node src/tests/ConnectionTest.js
node src/tests/AuthTest.js
node src/tests/MessageTest.js
```

## 📁 Proje Yapısı

```
node-websocket-agent/
├── package.json
├── .env
├── .env.example
├── README.md
├── src/
│   ├── index.js                 # Ana giriş noktası
│   ├── config/
│   │   └── config.js            # Konfigürasyon yönetimi
│   ├── websocket/
│   │   ├── WebSocketClient.js   # WebSocket bağlantı yöneticisi
│   │   ├── MessageHandler.js    # Gelen mesaj işleyici
│   │   └── ReconnectManager.js  # Yeniden bağlanma mantığı
│   ├── auth/
│   │   └── AuthService.js       # Token alma ve yenileme
│   ├── device/
│   │   └── DeviceManager.js     # Cihaz kaydı ve yönetimi
│   ├── tests/
│   │   ├── ConnectionTest.js    # Bağlantı testleri
│   │   ├── AuthTest.js          # Kimlik doğrulama testleri
│   │   └── MessageTest.js       # Mesajlaşma testleri
│   └── utils/
│       ├── logger.js            # Loglama utility
│       └── helpers.js           # Yardımcı fonksiyonlar
└── logs/
    └── agent.log
```

## 🧪 Test Senaryoları

| Test | Açıklama | Beklenen Sonuç |
|------|----------|----------------|
| HTTP Bağlantısı | Gateway'e HTTP erişimi | 200 OK |
| Auth Login | JWT token alma | Token alınır |
| WS Temel Bağlantı | WebSocket handshake | Connected event |
| Registry ID Kaydı | Cihaz kaydı | Device ID alınır |
| Mesaj Alışverişi | Ping/Pong test | Yanıt alınır |
| Yeniden Bağlanma | Disconnect/Reconnect | Otomatik bağlanır |

## 🔄 Akış Diyagramı

```
┌─────────────────┐
│   Agent Start   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Login (HTTP)   │──────► JWT Token
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ WS Connect with │
│   Registry ID   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Handshake +     │
│ Device Register │──────► Device ID
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Message Loop   │◄─────┐
│  (Listen/Send)  │      │
└────────┬────────┘      │
         │               │
    Disconnect?          │
         │               │
         ▼               │
┌─────────────────┐      │
│   Reconnect     │──────┘
└─────────────────┘
```

## ⚠️ Önemli Notlar

- **Registry ID**: Her cihaz için benzersiz olmalı
- **JWT Secret**: Gateway ve Auth Service aynı secret kullanmalı
- **WebSocket Path**: Sunucu tarafındaki path ile eşleşmeli
- **Timeout Değerleri**: Ağ durumuna göre ayarlanmalı
- **Loglama**: Production'da `info` seviyesi önerilir

## 📝 Mesaj Formatları

### Sunucuya Gönderilen Mesajlar

```json
{
  "type": "PING",
  "timestamp": 1706886400000
}
```

```json
{
  "type": "STATUS",
  "deviceId": "device-uuid",
  "status": "ACTIVE",
  "uptime": 3600
}
```

### Sunucudan Gelen Mesajlar

```json
{
  "type": "DEVICE_REGISTERED",
  "deviceId": "device-uuid"
}
```

```json
{
  "type": "COMMAND",
  "payload": {
    "commandId": "cmd-123",
    "action": "restart"
  }
}
```

## 🛠️ Geliştirme

### Yeni Test Ekleme

1. `src/tests/` dizininde yeni bir test dosyası oluşturun
2. Mevcut test yapısını takip edin
3. `recordResult()` ile sonuçları kaydedin
4. `printResults()` ile özet yazdırın

### Yeni Mesaj Handler Ekleme

1. `WebSocketClient.js` içindeki `onMessage()` metoduna case ekleyin
2. Veya `MessageHandler.js` kullanarak modüler handler kaydedin

## 📄 Lisans

ISC
