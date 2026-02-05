const { EventEmitter } = require('events');
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Yeniden bağlanma mantığını yöneten sınıf
 */
class ReconnectManager extends EventEmitter {
    constructor(options = {}) {
        super();

        this.baseInterval = options.reconnectInterval || config.websocket.reconnectInterval;
        this.maxAttempts = options.maxReconnectAttempts || config.websocket.maxReconnectAttempts;
        this.maxInterval = options.maxInterval || 60000; // Maksimum 1 dakika
        this.backoffMultiplier = options.backoffMultiplier || 1.5;

        this.attempts = 0;
        this.isReconnecting = false;
        this.reconnectTimer = null;
        this.lastAttemptTime = null;
    }

    /**
     * Yeniden bağlanma sürecini başlatır
     * @param {Function} connectFn - Bağlantı fonksiyonu (Promise döndürmeli)
     */
    async start(connectFn) {
        if (this.isReconnecting) {
            logger.debug('Yeniden bağlanma zaten devam ediyor');
            return;
        }

        this.isReconnecting = true;
        await this.attemptReconnect(connectFn);
    }

    /**
     * Yeniden bağlanma denemesi yapar
     * @param {Function} connectFn - Bağlantı fonksiyonu
     */
    async attemptReconnect(connectFn) {
        if (!this.isReconnecting) {
            return;
        }

        if (this.attempts >= this.maxAttempts) {
            logger.error('Maksimum yeniden bağlanma denemesi aşıldı', {
                attempts: this.attempts,
                maxAttempts: this.maxAttempts
            });
            this.isReconnecting = false;
            this.emit('maxAttemptsReached', { attempts: this.attempts });
            return;
        }

        this.attempts++;
        this.lastAttemptTime = Date.now();

        const delay = this.calculateDelay();

        logger.info('Yeniden bağlanma denemesi planlandı', {
            attempt: this.attempts,
            maxAttempts: this.maxAttempts,
            delayMs: delay
        });

        this.emit('reconnecting', {
            attempt: this.attempts,
            maxAttempts: this.maxAttempts,
            delayMs: delay
        });

        this.reconnectTimer = setTimeout(async () => {
            try {
                logger.info('Yeniden bağlanma denemesi başlıyor...', {
                    attempt: this.attempts
                });

                await connectFn();

                // Başarılı bağlantı
                this.reset();
                this.emit('reconnected');

            } catch (error) {
                logger.error('Yeniden bağlanma başarısız', {
                    attempt: this.attempts,
                    error: error.message
                });

                this.emit('reconnectFailed', {
                    attempt: this.attempts,
                    error
                });

                // Sonraki deneme
                await this.attemptReconnect(connectFn);
            }
        }, delay);
    }

    /**
     * Gecikme süresini hesaplar (exponential backoff)
     * @returns {number} Milisaniye cinsinden gecikme
     */
    calculateDelay() {
        // Exponential backoff with jitter
        const exponentialDelay = this.baseInterval * Math.pow(this.backoffMultiplier, this.attempts - 1);
        const jitter = Math.random() * 1000; // 0-1 saniye jitter
        const delay = Math.min(exponentialDelay + jitter, this.maxInterval);

        return Math.floor(delay);
    }

    /**
     * Yeniden bağlanma sürecini durdurur
     */
    stop() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.isReconnecting = false;
        logger.debug('Yeniden bağlanma süreci durduruldu');
    }

    /**
     * Deneme sayacını sıfırlar (başarılı bağlantı sonrası)
     */
    reset() {
        this.attempts = 0;
        this.isReconnecting = false;
        this.lastAttemptTime = null;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        logger.debug('Yeniden bağlanma yöneticisi sıfırlandı');
    }

    /**
     * Mevcut durumu döndürür
     */
    getStatus() {
        return {
            isReconnecting: this.isReconnecting,
            attempts: this.attempts,
            maxAttempts: this.maxAttempts,
            lastAttemptTime: this.lastAttemptTime,
            nextDelay: this.isReconnecting ? this.calculateDelay() : null
        };
    }
}

module.exports = ReconnectManager;
