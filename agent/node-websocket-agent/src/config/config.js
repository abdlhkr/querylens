require('dotenv').config();

module.exports = {
  // Gateway bağlantı bilgileri
  gateway: {
    httpUrl: process.env.GATEWAY_HTTP_URL || 'http://localhost:8080',
    wsUrl: process.env.GATEWAY_WS_URL || 'ws://localhost:8080',
  },
  
  // Kimlik doğrulama
  auth: {
    email: process.env.AUTH_EMAIL,
    password: process.env.AUTH_PASSWORD,
    registryId: process.env.REGISTRY_ID,  // Cihaz kayıt ID'si
  },
  
  // WebSocket ayarları
  websocket: {
    path: process.env.WS_PATH || '/ws/device',
    reconnectInterval: parseInt(process.env.RECONNECT_INTERVAL) || 5000,
    maxReconnectAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS) || 10,
    pingInterval: parseInt(process.env.PING_INTERVAL) || 30000,
    connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT) || 10000,
  },
  
  // Loglama
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/agent.log',
  }
};
