const fs = require('fs');
const path = require('path');
const AuthService = require('./auth/AuthService');
const WebSocketClient = require('./websocket/WebSocketClient');
const DeviceManager = require('./device/DeviceManager');
const DatabaseManager = require('./database/DatabaseManager');
const logger = require('./utils/logger');
const config = require('./config/config');

class WebSocketAgent {
    constructor() {
        this.authService = new AuthService();
        this.deviceManager = new DeviceManager();
        this.databaseManager = new DatabaseManager();
        this.wsClient = null;
        this.isRunning = false;
    }

    /**
     * Agent'ı başlatır
     */
    async start() {
        logger.info('🚀 WebSocket Test Agent başlatılıyor...');
        logger.info('Konfigürasyon:', {
            gatewayUrl: config.gateway.wsUrl,
            wsPath: config.websocket.path,
            registryId: config.auth.registryId ? '***' : 'YOK'
        });

        // Logs dizinini oluştur
        this.ensureLogsDirectory();

        try {
/*             // 1. Login yap (gerekirse)
            if (config.auth.email && config.auth.password) {
                await this.authService.login();
            } */

            // 2. Mevcut device ID'yi yükle
            const existingDeviceId = this.deviceManager.loadDeviceId();

            // 3. WebSocket bağlantısı kur
            this.wsClient = new WebSocketClient(this.authService);
            this.setupEventListeners();

            await this.wsClient.connect({ deviceId: existingDeviceId });

            this.isRunning = true;

            // Graceful shutdown
            this.setupGracefulShutdown();

        } catch (error) {
            logger.error('Agent başlatma hatası', { error: error.message });
            throw error;
        }
    }

    /**
     * Logs dizinini oluşturur
     */
    ensureLogsDirectory() {
        const logsDir = path.dirname(config.logging.file);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
            logger.debug('Logs dizini oluşturuldu', { path: logsDir });
        }
    }

    /**
     * Event listener'ları ayarlar
     */
    setupEventListeners() {
        this.wsClient.on('connected', () => {
            logger.info('🟢 Bağlantı aktif');
        });

        this.wsClient.on('deviceRegistered', ({ deviceId }) => {
            this.deviceManager.saveDeviceId(deviceId);
            logger.info('📱 Cihaz kaydedildi', { deviceId });
        });

        this.wsClient.on('connectionConfirmed', (message) => {
            logger.info('✅ Bağlantı onaylandı', {
                status: message.data?.status,
                connectedAt: message.data?.connectedAt
            });
        });

        this.wsClient.on('authenticated', (message) => {
            logger.info('🔐 Kimlik doğrulama başarılı');
        });

        this.wsClient.on('authFailed', (message) => {
            logger.error('🔒 Kimlik doğrulama başarısız', { reason: message.reason });
        });

        this.wsClient.on('message', (message) => {
            logger.info('📨 Mesaj:', message);
            this.handleMessage(message);
        });

        this.wsClient.on('rawMessage', (data) => {
            logger.debug('📨 Raw mesaj:', { data });
        });

        this.wsClient.on('disconnected', ({ code, reason }) => {
            logger.warn('🔴 Bağlantı kesildi', { code, reason });
        });

        this.wsClient.on('error', (error) => {
            logger.error('⚠️ Hata', { error: error.message });
        });

        this.wsClient.on('maxReconnectReached', () => {
            logger.error('❌ Maksimum yeniden bağlanma denemesi aşıldı');
            this.stop();
        });

        this.wsClient.on('timeout', () => {
            logger.error('⏱️ Bağlantı zaman aşımı');
        });
    }

    /**
     * Gelen mesajları işler
     */
    handleMessage(message) {
        switch (message.type) {
            case 'COMMAND':
                this.executeCommand(message.payload);
                break;

            case 'CONFIG_UPDATE':
                this.updateConfig(message.payload);
                break;

            case 'STATUS_REQUEST':
                this.sendStatus();
                break;

            case 'PING':
                this.wsClient.send({ type: 'PONG', timestamp: Date.now() });
                break;

            // Database message handlers
            case 'NEW_DATABASE':
                this.handleNewDatabase(message);
                break;

            case 'EXECUTE_QUERY':
                this.handleExecuteQuery(message);
                break;

            case 'DATABASE_DELETED':
                this.handleDatabaseDeleted(message);
                break;

            default:
                logger.debug('Bilinmeyen mesaj türü', { type: message.type });
        }
    }

    /**
     * Yeni database ekleme bildirimi
     */
    async handleNewDatabase(message) {
        const result = await this.databaseManager.handleNewDatabase(message);

        if (result.success) {
            this.wsClient.send({
                type: 'DATABASE_VERIFIED',
                databaseId: message.databaseId
            });
        } else {
            this.wsClient.send({
                type: 'DATABASE_FAILED',
                databaseId: message.databaseId,
                error: result.error
            });
        }
    }

    /**
     * Query çalıştırma isteği
     */
    async handleExecuteQuery(message) {
        const { databaseId, requestId, query } = message;

        try {
            const result = await this.databaseManager.executeQuery(databaseId, query);

            this.wsClient.send({
                type: 'QUERY_RESULT',
                requestId,
                databaseId,
                originalQuery: query,  // Include for reference
                data: result.data,
                rowCount: result.rowCount,
                executionTimeMs: result.executionTimeMs
            });
        } catch (error) {
            // Include original query for self-healing purposes
            this.wsClient.send({
                type: 'QUERY_ERROR',
                requestId,
                databaseId,
                originalQuery: query,  // Critical for self-healing
                error: error.message,
                errorCode: error.code || 'UNKNOWN'
            });
        }
    }

    /**
     * Database silme bildirimi
     */
    async handleDatabaseDeleted(message) {
        await this.databaseManager.handleDatabaseDeleted(message.databaseId);
        logger.info('Database silindi', { databaseId: message.databaseId });
    }

    /**
     * Komut çalıştırır
     */
    executeCommand(payload) {
        logger.info('Komut alındı', { command: payload });

        // Komut sonucunu geri gönder
        this.wsClient.send({
            type: 'COMMAND_RESULT',
            commandId: payload.commandId,
            status: 'COMPLETED',
            timestamp: Date.now()
        });
    }

    /**
     * Konfigürasyonu günceller
     */
    updateConfig(payload) {
        logger.info('Konfigürasyon güncelleme isteği', { payload });

        // Konfigürasyon güncelleme onayı
        this.wsClient.send({
            type: 'CONFIG_ACK',
            success: true,
            timestamp: Date.now()
        });
    }

    /**
     * Durum bilgisi gönderir
     */
    sendStatus() {
        const status = this.deviceManager.getStatusInfo();

        this.wsClient.send({
            type: 'STATUS',
            ...status,
            isConnected: this.wsClient?.isConnected || false
        });

        logger.debug('Durum bilgisi gönderildi');
    }

    /**
     * Graceful shutdown ayarlar
     */
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            logger.info(`${signal} alındı, kapatılıyor...`);
            await this.stop();
            process.exit(0);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

        // Windows için
        if (process.platform === 'win32') {
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.on('SIGINT', () => {
                process.emit('SIGINT');
            });
        }
    }

    /**
     * Agent'ı durdurur
     */
    async stop() {
        logger.info('Agent durduruluyor...');
        this.isRunning = false;

        // Shutdown database connections
        if (this.databaseManager) {
            await this.databaseManager.shutdown();
        }

        if (this.wsClient) {
            this.wsClient.disconnect();
            this.wsClient = null;
        }

        logger.info('Agent durduruldu');
    }
}

// Ana çalıştırma
const agent = new WebSocketAgent();

agent.start().catch((error) => {
    logger.error('Fatal error', { error: error.message });
    process.exit(1);
});
