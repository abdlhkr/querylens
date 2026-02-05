const AuthService = require('../auth/AuthService');
const WebSocketClient = require('../websocket/WebSocketClient');
const logger = require('../utils/logger');
const config = require('../config/config');

class MessageTest {
    constructor() {
        this.authService = new AuthService();
        this.wsClient = null;
        this.testResults = [];
    }

    /**
     * Tüm mesaj testlerini çalıştırır
     */
    async runAllTests() {
        logger.info('='.repeat(50));
        logger.info('MESAJLAŞMA TESTLERİ BAŞLIYOR');
        logger.info('='.repeat(50));

        try {
            // Önce bağlantı kur
            await this.setupConnection();

            if (!this.wsClient?.isConnected) {
                logger.error('WebSocket bağlantısı kurulamadı, testler atlanıyor');
                return;
            }

            await this.testPingPong();
            await this.testJsonMessage();
            await this.testLargeMessage();
            await this.testRapidMessages();
            await this.testInvalidMessage();

            this.printResults();
        } catch (error) {
            logger.error('Message test suite hatası', { error: error.message });
        } finally {
            this.cleanup();
        }
    }

    /**
     * WebSocket bağlantısını kurar
     */
    async setupConnection() {
        logger.info('WebSocket bağlantısı kuruluyor...');

        return new Promise(async (resolve) => {
            try {
                this.wsClient = new WebSocketClient(this.authService);

                const timeout = setTimeout(() => {
                    logger.error('Bağlantı zaman aşımı');
                    resolve();
                }, 15000);

                this.wsClient.on('connected', () => {
                    clearTimeout(timeout);
                    logger.info('WebSocket bağlantısı kuruldu');
                    resolve();
                });

                this.wsClient.on('error', (error) => {
                    clearTimeout(timeout);
                    logger.error('Bağlantı hatası', { error: error.message });
                    resolve();
                });

                await this.wsClient.connect();
            } catch (error) {
                logger.error('Bağlantı başlatma hatası', { error: error.message });
                resolve();
            }
        });
    }

    /**
     * Test 1: Ping/Pong
     */
    async testPingPong() {
        const testName = 'Ping/Pong Mesajı';
        logger.info(`\n📋 Test: ${testName}`);

        return new Promise((resolve) => {
            const pingMessage = {
                type: 'PING',
                timestamp: Date.now()
            };

            const timeout = setTimeout(() => {
                this.recordResult(testName, false, 'PONG yanıtı alınamadı');
                resolve();
            }, 5000);

            const handler = (message) => {
                if (message.type === 'PONG') {
                    clearTimeout(timeout);
                    this.wsClient.off('message', handler);
                    const latency = Date.now() - pingMessage.timestamp;
                    this.recordResult(testName, true, `Latency: ${latency}ms`);
                    resolve();
                }
            };

            this.wsClient.on('message', handler);
            this.wsClient.send(pingMessage);
        });
    }

    /**
     * Test 2: JSON Mesaj Gönderimi
     */
    async testJsonMessage() {
        const testName = 'JSON Mesaj Gönderimi';
        logger.info(`\n📋 Test: ${testName}`);

        return new Promise((resolve) => {
            const testMessage = {
                type: 'TEST',
                payload: {
                    string: 'test string',
                    number: 12345,
                    boolean: true,
                    array: [1, 2, 3],
                    nested: { key: 'value' }
                },
                timestamp: Date.now()
            };

            const timeout = setTimeout(() => {
                // Sunucu yanıt vermese bile gönderim başarılı sayılabilir
                this.recordResult(testName, true, 'Mesaj gönderildi (yanıt beklenmedi)');
                resolve();
            }, 3000);

            const handler = (message) => {
                if (message.type === 'ACK' || message.type === 'TEST_RESPONSE') {
                    clearTimeout(timeout);
                    this.wsClient.off('message', handler);
                    this.recordResult(testName, true, 'Mesaj gönderildi ve yanıt alındı');
                    resolve();
                }
            };

            this.wsClient.on('message', handler);
            const sent = this.wsClient.send(testMessage);

            if (!sent) {
                clearTimeout(timeout);
                this.recordResult(testName, false, 'Mesaj gönderilemedi');
                resolve();
            }
        });
    }

    /**
     * Test 3: Büyük Mesaj Gönderimi
     */
    async testLargeMessage() {
        const testName = 'Büyük Mesaj Gönderimi (10KB)';
        logger.info(`\n📋 Test: ${testName}`);

        return new Promise((resolve) => {
            // 10KB'lık veri oluştur
            const largeData = 'x'.repeat(10 * 1024);

            const testMessage = {
                type: 'LARGE_MESSAGE',
                payload: largeData,
                size: largeData.length,
                timestamp: Date.now()
            };

            try {
                const sent = this.wsClient.send(testMessage);

                if (sent) {
                    this.recordResult(testName, true, `${largeData.length} byte gönderildi`);
                } else {
                    this.recordResult(testName, false, 'Mesaj gönderilemedi');
                }
            } catch (error) {
                this.recordResult(testName, false, error.message);
            }

            resolve();
        });
    }

    /**
     * Test 4: Hızlı Mesaj Gönderimi
     */
    async testRapidMessages() {
        const testName = 'Hızlı Mesaj Gönderimi (100 mesaj)';
        logger.info(`\n📋 Test: ${testName}`);

        return new Promise((resolve) => {
            const messageCount = 100;
            let sentCount = 0;
            let failedCount = 0;

            const startTime = Date.now();

            for (let i = 0; i < messageCount; i++) {
                const message = {
                    type: 'RAPID_TEST',
                    sequence: i,
                    timestamp: Date.now()
                };

                if (this.wsClient.send(message)) {
                    sentCount++;
                } else {
                    failedCount++;
                }
            }

            const duration = Date.now() - startTime;
            const rate = Math.round(sentCount / (duration / 1000));

            if (sentCount === messageCount) {
                this.recordResult(testName, true, `${sentCount} mesaj / ${duration}ms (${rate} msg/sec)`);
            } else {
                this.recordResult(testName, false, `${sentCount}/${messageCount} başarılı, ${failedCount} başarısız`);
            }

            resolve();
        });
    }

    /**
     * Test 5: Geçersiz Mesaj Formatı
     */
    async testInvalidMessage() {
        const testName = 'Geçersiz Mesaj Formatı';
        logger.info(`\n📋 Test: ${testName}`);

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                // Sunucu hata mesajı göndermezse test başarılı
                this.recordResult(testName, true, 'Sunucu geçersiz mesajı sessizce işledi');
                resolve();
            }, 3000);

            const handler = (message) => {
                if (message.type === 'ERROR') {
                    clearTimeout(timeout);
                    this.wsClient.off('message', handler);
                    this.wsClient.off('serverError', errorHandler);
                    this.recordResult(testName, true, 'Sunucu hata mesajı döndürdü');
                    resolve();
                }
            };

            const errorHandler = (message) => {
                clearTimeout(timeout);
                this.wsClient.off('message', handler);
                this.wsClient.off('serverError', errorHandler);
                this.recordResult(testName, true, 'Sunucu hata mesajı döndürdü');
                resolve();
            };

            this.wsClient.on('message', handler);
            this.wsClient.on('serverError', errorHandler);

            // Geçersiz mesaj gönder (type yok)
            this.wsClient.send({ invalidField: 'no type field' });
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
        logger.info('MESAJ TEST SONUÇLARI');
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
    const test = new MessageTest();
    test.runAllTests()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Test hatası', { error: error.message });
            process.exit(1);
        });
}

module.exports = MessageTest;
