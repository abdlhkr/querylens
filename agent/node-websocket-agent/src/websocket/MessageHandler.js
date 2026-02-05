const logger = require('../utils/logger');

/**
 * Gelen mesajları işleyen handler sınıfı
 */
class MessageHandler {
    constructor() {
        this.handlers = new Map();
        this.defaultHandler = null;

        // Varsayılan handler'ları kaydet
        this.registerDefaultHandlers();
    }

    /**
     * Varsayılan mesaj handler'larını kaydeder
     */
    registerDefaultHandlers() {
        // PING mesajı
        this.register('PING', (message, context) => {
            logger.debug('PING mesajı alındı');
            return { type: 'PONG', timestamp: Date.now() };
        });

        // ACK mesajı
        this.register('ACK', (message, context) => {
            logger.debug('ACK alındı', { messageId: message.messageId });
            return null; // Yanıt gerekmez
        });

        // ERROR mesajı
        this.register('ERROR', (message, context) => {
            logger.error('Sunucu hatası alındı', {
                code: message.code,
                error: message.error
            });
            return null;
        });

        // STATUS_REQUEST mesajı
        this.register('STATUS_REQUEST', (message, context) => {
            logger.debug('Durum isteği alındı');
            return {
                type: 'STATUS',
                deviceId: context?.deviceId,
                timestamp: Date.now(),
                status: 'ACTIVE',
                uptime: process.uptime()
            };
        });
    }

    /**
     * Mesaj türü için handler kaydeder
     * @param {string} messageType - Mesaj türü
     * @param {Function} handler - Handler fonksiyonu (message, context) => response
     */
    register(messageType, handler) {
        if (typeof handler !== 'function') {
            throw new Error('Handler must be a function');
        }
        this.handlers.set(messageType, handler);
        logger.debug('Handler kaydedildi', { messageType });
    }

    /**
     * Handler'ı kaldırır
     * @param {string} messageType - Mesaj türü
     */
    unregister(messageType) {
        this.handlers.delete(messageType);
        logger.debug('Handler kaldırıldı', { messageType });
    }

    /**
     * Varsayılan handler'ı ayarlar (bilinmeyen mesaj türleri için)
     * @param {Function} handler - Handler fonksiyonu
     */
    setDefaultHandler(handler) {
        if (typeof handler !== 'function') {
            throw new Error('Handler must be a function');
        }
        this.defaultHandler = handler;
    }

    /**
     * Mesajı işler
     * @param {Object|string} rawMessage - Ham mesaj
     * @param {Object} context - Bağlam bilgisi (deviceId, ws client vb.)
     * @returns {Object|null} Yanıt mesajı veya null
     */
    handle(rawMessage, context = {}) {
        let message;

        // Mesajı parse et
        try {
            if (typeof rawMessage === 'string') {
                message = JSON.parse(rawMessage);
            } else if (Buffer.isBuffer(rawMessage)) {
                message = JSON.parse(rawMessage.toString());
            } else {
                message = rawMessage;
            }
        } catch (error) {
            logger.warn('Mesaj parse edilemedi', { raw: String(rawMessage) });
            return null;
        }

        // Mesaj türünü al
        const messageType = message.type;
        if (!messageType) {
            logger.warn('Mesaj türü belirtilmemiş', { message });
            return null;
        }

        // Handler'ı bul ve çalıştır
        const handler = this.handlers.get(messageType);

        if (handler) {
            try {
                return handler(message, context);
            } catch (error) {
                logger.error('Handler hatası', {
                    messageType,
                    error: error.message
                });
                return null;
            }
        }

        // Varsayılan handler'ı dene
        if (this.defaultHandler) {
            try {
                return this.defaultHandler(message, context);
            } catch (error) {
                logger.error('Default handler hatası', { error: error.message });
            }
        }

        logger.debug('Bilinmeyen mesaj türü', { messageType });
        return null;
    }

    /**
     * Kayıtlı handler sayısını döndürür
     */
    get handlerCount() {
        return this.handlers.size;
    }

    /**
     * Kayıtlı mesaj türlerini döndürür
     */
    get registeredTypes() {
        return Array.from(this.handlers.keys());
    }
}

module.exports = MessageHandler;
