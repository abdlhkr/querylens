const WebSocket = require('ws');
const { EventEmitter } = require('events');
const config = require('../config/config');
const logger = require('../utils/logger');

class WebSocketClient extends EventEmitter {
    constructor(authService) {
        super();
        this.authService = authService;
        this.ws = null;
        this.deviceId = null;
        this.registryId = config.auth.registryId;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.pingInterval = null;
        this.connectionTimeout = null;
    }

    /**
     * WebSocket bağlantısını başlatır
     * @param {Object} options - Bağlantı seçenekleri
     * @param {string} options.deviceId - Daha önce alınmış device ID (opsiyonel)
     */
    async connect(options = {}) {
        this.deviceId = options.deviceId || null;

        try {
            // Bağlantı URL'ini oluştur
            const wsUrl = this.buildConnectionUrl();
            logger.info('WebSocket bağlantısı başlatılıyor...', { url: wsUrl });

            // WebSocket headers
            const headers = await this.buildHeaders();

            // WebSocket bağlantısı
            this.ws = new WebSocket(wsUrl, { headers });

            // Bağlantı timeout'u ayarla
            this.setConnectionTimeout();

            // Event handler'ları bağla
            this.setupEventHandlers();
        } catch (error) {
            logger.error('WebSocket bağlantısı başlatılamadı', { error: error.message });
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Bağlantı URL'ini oluşturur
     */
    buildConnectionUrl() {
        const baseUrl = config.gateway.wsUrl;
        const path = config.websocket.path;

        // Query parametreleri
        const params = new URLSearchParams();

        if (this.deviceId) {
            // Mevcut cihaz ile bağlan
            params.append('deviceId', this.deviceId);
        } else if (this.registryId) {
            // Yeni kayıt için registry ID kullan
            params.append('code', this.registryId);
        }

        const queryString = params.toString();
        return `${baseUrl}${path}${queryString ? '?' + queryString : ''}`;
    }

    /**
     * Bağlantı header'larını oluşturur
     */
    async buildHeaders() {
        const headers = {
            'Origin': config.gateway.httpUrl,
            'User-Agent': 'NodeWebSocketAgent/1.0'
        };

        // Eğer JWT token gerekiyorsa
        try {
            const token = await this.authService.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        } catch (error) {
            logger.warn('Token alınamadı, tokensiz devam ediliyor');
        }

        return headers;
    }

    /**
     * Event handler'ları ayarlar
     */
    setupEventHandlers() {
        this.ws.on('open', () => this.onOpen());
        this.ws.on('message', (data) => this.onMessage(data));
        this.ws.on('close', (code, reason) => this.onClose(code, reason));
        this.ws.on('error', (error) => this.onError(error));
        this.ws.on('ping', () => this.onPing());
        this.ws.on('pong', () => this.onPong());
    }

    /**
     * Bağlantı açıldığında
     */
    onOpen() {
        this.clearConnectionTimeout();
        this.isConnected = true;
        this.reconnectAttempts = 0;

        logger.info('✅ WebSocket bağlantısı başarılı!');

        // Ping interval başlat
        this.startPingInterval();

        this.emit('connected');
    }

    /**
     * Mesaj alındığında
     */
    onMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            logger.debug('Mesaj alındı', { type: message.type });

            // Özel mesaj türlerini işle
            switch (message.type) {
                case 'CONNECTION_CONFIRMED':
                    // Sunucu bağlantıyı onayladı ve deviceId gönderdi
                    if (message.data && message.data.deviceId) {
                        this.deviceId = message.data.deviceId;
                        logger.info('✅ Bağlantı onaylandı, cihaz kaydedildi', { deviceId: this.deviceId });
                        this.emit('deviceRegistered', { deviceId: this.deviceId, data: message.data });
                    }
                    this.emit('connectionConfirmed', message);
                    break;

                case 'DEVICE_REGISTERED':
                    this.deviceId = message.deviceId;
                    logger.info('Cihaz kaydedildi', { deviceId: this.deviceId });
                    this.emit('deviceRegistered', { deviceId: this.deviceId });
                    break;

                case 'AUTH_SUCCESS':
                    logger.info('Kimlik doğrulama başarılı');
                    this.emit('authenticated', message);
                    break;

                case 'AUTH_FAILED':
                    logger.error('Kimlik doğrulama başarısız', { reason: message.reason });
                    this.emit('authFailed', message);
                    break;

                case 'PING':
                    this.sendPong();
                    break;

                case 'ERROR':
                    logger.error('Sunucu hatası', { error: message.error });
                    this.emit('serverError', message);
                    break;

                default:
                    this.emit('message', message);
            }
        } catch (error) {
            logger.warn('Mesaj parse edilemedi', { raw: data.toString() });
            this.emit('rawMessage', data.toString());
        }
    }

    /**
     * Bağlantı kapandığında
     */
    onClose(code, reason) {
        this.isConnected = false;
        this.stopPingInterval();
        this.clearConnectionTimeout();

        const reasonStr = reason?.toString() || 'Bilinmiyor';
        logger.warn('WebSocket bağlantısı kapandı', { code, reason: reasonStr });

        this.emit('disconnected', { code, reason: reasonStr });

        // Otomatik yeniden bağlanma
        if (code !== 1000) { // Normal kapatma değilse
            this.scheduleReconnect();
        }
    }

    /**
     * Hata oluştuğunda
     */
    onError(error) {
        logger.error('WebSocket hatası', { error: error.message });
        this.emit('error', error);
    }

    /**
     * Ping alındığında
     */
    onPing() {
        logger.debug('Ping alındı');
    }

    /**
     * Pong alındığında
     */
    onPong() {
        logger.debug('Pong alındı');
    }

    /**
     * Mesaj gönderir
     */
    send(message) {
        if (!this.isConnected || !this.ws) {
            logger.error('Mesaj gönderilemedi: Bağlantı yok');
            return false;
        }

        try {
            const payload = typeof message === 'string' ? message : JSON.stringify(message);
            this.ws.send(payload);
            logger.debug('Mesaj gönderildi', { type: message.type || 'raw' });
            return true;
        } catch (error) {
            logger.error('Mesaj gönderme hatası', { error: error.message });
            return false;
        }
    }

    /**
     * Pong yanıtı gönderir
     */
    sendPong() {
        this.send({ type: 'PONG', timestamp: Date.now() });
    }

    /**
     * Ping interval'ını başlatır
     */
    startPingInterval() {
        this.stopPingInterval();
        this.pingInterval = setInterval(() => {
            if (this.isConnected) {
                this.ws.ping();
                logger.debug('Ping gönderildi');
            }
        }, config.websocket.pingInterval);
    }

    /**
     * Ping interval'ını durdurur
     */
    stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    /**
     * Bağlantı timeout'u ayarlar
     */
    setConnectionTimeout() {
        this.connectionTimeout = setTimeout(() => {
            if (!this.isConnected) {
                logger.error('Bağlantı zaman aşımı');
                this.ws?.terminate();
                this.emit('timeout');
            }
        }, config.websocket.connectionTimeout);
    }

    /**
     * Bağlantı timeout'unu temizler
     */
    clearConnectionTimeout() {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
    }

    /**
     * Yeniden bağlanmayı planlar
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= config.websocket.maxReconnectAttempts) {
            logger.error('Maksimum yeniden bağlanma denemesi aşıldı');
            this.emit('maxReconnectReached');
            return;
        }

        this.reconnectAttempts++;
        const delay = config.websocket.reconnectInterval * this.reconnectAttempts;

        logger.info(`Yeniden bağlanma planlandı`, {
            attempt: this.reconnectAttempts,
            delayMs: delay
        });

        setTimeout(() => {
            this.connect({ deviceId: this.deviceId });
        }, delay);
    }

    /**
     * Bağlantıyı kapatır
     */
    disconnect() {
        this.stopPingInterval();
        this.clearConnectionTimeout();

        if (this.ws) {
            this.ws.close(1000, 'Client disconnecting');
            this.ws = null;
        }

        this.isConnected = false;
        logger.info('WebSocket bağlantısı kapatıldı');
    }
}

module.exports = WebSocketClient;
