const AuthService = require('../auth/AuthService');
const WebSocketClient = require('../websocket/WebSocketClient');
const logger = require('../utils/logger');
const config = require('../config/config');

class ConnectionTest {
    constructor() {
        this.authService = new AuthService();
        this.wsClient = null;
        this.testResults = [];
    }

    /**
     * Tüm testleri çalıştırır
     */
    async runAllTests() {
        logger.info('='.repeat(50));
        logger.info('BAĞLANTI TESTLERİ BAŞLIYOR');
        logger.info('='.repeat(50));

        try {
            await this.testHttpConnection();
            await this.testAuthLogin();
            await this.testWebSocketConnection();
            await this.testRegistryIdConnection();
            await this.testMessageExchange();
            await this.testReconnection();

            this.printResults();
        } catch (error) {
            logger.error('Test suite hatası', { error: error.message });
        } finally {
            this.cleanup();
        }
    }

    /**
     * Test 1: HTTP Bağlantısı
     */
    async testHttpConnection() {
        const testName = 'HTTP Gateway Bağlantısı';
        logger.info(`\n📋 Test: ${testName}`);

        try {
            const axios = require('axios');
            const response = await axios.get(`${config.gateway.httpUrl}/actuator/health`, {
                timeout: 5000
            });

            this.recordResult(testName, true, `Status: ${response.status}`);
        } catch (error) {
            // Health endpoint yoksa auth endpoint dene
            try {
                const axios = require('axios');
                await axios.get(`${config.gateway.httpUrl}/auth/status`, { timeout: 5000 });
                this.recordResult(testName, true, 'Gateway erişilebilir');
            } catch (e) {
                this.recordResult(testName, false, error.message);
            }
        }
    }

    /**
     * Test 2: Auth Login
     */
    async testAuthLogin() {
        const testName = 'Auth Service Login';
        logger.info(`\n📋 Test: ${testName}`);

        try {
            const token = await this.authService.login();
            this.recordResult(testName, true, `Token alındı (${token.length} karakter)`);
        } catch (error) {
            this.recordResult(testName, false, error.message);
        }
    }

    /**
     * Test 3: WebSocket Temel Bağlantı
     */
    async testWebSocketConnection() {
        const testName = 'WebSocket Temel Bağlantı';
        logger.info(`\n📋 Test: ${testName}`);

        return new Promise(async (resolve) => {
            try {
                this.wsClient = new WebSocketClient(this.authService);

                const timeout = setTimeout(() => {
                    this.recordResult(testName, false, 'Bağlantı zaman aşımı');
                    resolve();
                }, 15000);

                this.wsClient.on('connected', () => {
                    clearTimeout(timeout);
                    this.recordResult(testName, true, 'Bağlantı başarılı');
                    resolve();
                });

                this.wsClient.on('error', (error) => {
                    clearTimeout(timeout);
                    this.recordResult(testName, false, error.message);
                    resolve();
                });

                await this.wsClient.connect();
            } catch (error) {
                this.recordResult(testName, false, error.message);
                resolve();
            }
        });
    }

    /**
     * Test 4: Registry ID ile Bağlantı
     */
    async testRegistryIdConnection() {
        const testName = 'Registry ID ile Cihaz Kaydı';
        logger.info(`\n📋 Test: ${testName}`);

        return new Promise(async (resolve) => {
            if (!config.auth.registryId) {
                this.recordResult(testName, false, 'Registry ID tanımlı değil');
                resolve();
                return;
            }

            try {
                if (this.wsClient) {
                    this.wsClient.disconnect();
                }

                this.wsClient = new WebSocketClient(this.authService);

                const timeout = setTimeout(() => {
                    this.recordResult(testName, false, 'Cihaz kaydı zaman aşımı');
                    resolve();
                }, 15000);

                this.wsClient.on('deviceRegistered', (data) => {
                    clearTimeout(timeout);
                    this.recordResult(testName, true, `Device ID: ${data.deviceId}`);
                    resolve();
                });

                this.wsClient.on('connected', () => {
                    logger.debug('Bağlantı kuruldu, cihaz kaydı bekleniyor...');
                });

                this.wsClient.on('error', (error) => {
                    clearTimeout(timeout);
                    this.recordResult(testName, false, error.message);
                    resolve();
                });

                await this.wsClient.connect();
            } catch (error) {
                this.recordResult(testName, false, error.message);
                resolve();
            }
        });
    }

    /**
     * Test 5: Mesaj Alışverişi
     */
    async testMessageExchange() {
        const testName = 'Mesaj Gönderme/Alma';
        logger.info(`\n📋 Test: ${testName}`);

        return new Promise((resolve) => {
            if (!this.wsClient?.isConnected) {
                this.recordResult(testName, false, 'WebSocket bağlı değil');
                resolve();
                return;
            }

            const testMessage = {
                type: 'PING',
                timestamp: Date.now(),
                payload: { test: true }
            };

            const timeout = setTimeout(() => {
                this.recordResult(testName, false, 'Yanıt alınamadı');
                resolve();
            }, 10000);

            const messageHandler = (message) => {
                if (message.type === 'PONG' || message.type === 'ACK') {
                    clearTimeout(timeout);
                    this.wsClient.off('message', messageHandler);
                    this.recordResult(testName, true, `Yanıt alındı: ${message.type}`);
                    resolve();
                }
            };

            this.wsClient.on('message', messageHandler);
            this.wsClient.send(testMessage);
        });
    }

    /**
     * Test 6: Yeniden Bağlanma
     */
    async testReconnection() {
        const testName = 'Yeniden Bağlanma';
        logger.info(`\n📋 Test: ${testName}`);

        return new Promise((resolve) => {
            if (!this.wsClient) {
                this.recordResult(testName, false, 'WebSocket client yok');
                resolve();
                return;
            }

            const deviceId = this.wsClient.deviceId;

            const timeout = setTimeout(() => {
                this.recordResult(testName, false, 'Yeniden bağlanma zaman aşımı');
                resolve();
            }, 20000);

            this.wsClient.on('connected', () => {
                clearTimeout(timeout);
                this.recordResult(testName, true, 'Yeniden bağlanma başarılı');
                resolve();
            });

            // Bağlantıyı kes ve yeniden bağlan
            this.wsClient.ws?.terminate();
        });
    }

    /**
     * Test sonucunu kaydeder
     */
    recordResult(name, success, message) {
        const result = { name, success, message };
        this.testResults.push(result);

        const icon = success ? '✅' : '❌';
        logger.info(`${icon} ${name}: ${message}`);
    }

    /**
     * Sonuçları yazdırır
     */
    printResults() {
        logger.info('\n' + '='.repeat(50));
        logger.info('TEST SONUÇLARI');
        logger.info('='.repeat(50));

        const passed = this.testResults.filter(r => r.success).length;
        const total = this.testResults.length;

        this.testResults.forEach(result => {
            const icon = result.success ? '✅' : '❌';
            logger.info(`${icon} ${result.name}`);
        });

        logger.info('-'.repeat(50));
        logger.info(`Toplam: ${passed}/${total} test başarılı`);
        logger.info('='.repeat(50));
    }

    /**
     * Cleanup
     */
    cleanup() {
        if (this.wsClient) {
            this.wsClient.disconnect();
            this.wsClient = null;
        }
    }
}

// Doğrudan çalıştırma
if (require.main === module) {
    const test = new ConnectionTest();
    test.runAllTests()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Test hatası', { error: error.message });
            process.exit(1);
        });
}

module.exports = ConnectionTest;
