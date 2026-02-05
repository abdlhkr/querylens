const AuthService = require('../auth/AuthService');
const logger = require('../utils/logger');
const config = require('../config/config');

class AuthTest {
    constructor() {
        this.authService = new AuthService();
        this.testResults = [];
    }

    /**
     * Tüm auth testlerini çalıştırır
     */
    async runAllTests() {
        logger.info('='.repeat(50));
        logger.info('KİMLİK DOĞRULAMA TESTLERİ BAŞLIYOR');
        logger.info('='.repeat(50));

        try {
            await this.testLoginWithValidCredentials();
            await this.testLoginWithInvalidCredentials();
            await this.testTokenRefresh();
            await this.testTokenExpiry();
            await this.testDeviceRegistration();

            this.printResults();
        } catch (error) {
            logger.error('Auth test suite hatası', { error: error.message });
        }
    }

    /**
     * Test 1: Geçerli kimlik bilgileriyle login
     */
    async testLoginWithValidCredentials() {
        const testName = 'Geçerli Kimlik Bilgileriyle Login';
        logger.info(`\n📋 Test: ${testName}`);

        try {
            const token = await this.authService.login();

            if (token && token.length > 0) {
                this.recordResult(testName, true, `Token alındı (${token.length} karakter)`);
            } else {
                this.recordResult(testName, false, 'Token boş veya geçersiz');
            }
        } catch (error) {
            this.recordResult(testName, false, error.message);
        }
    }

    /**
     * Test 2: Geçersiz kimlik bilgileriyle login
     */
    async testLoginWithInvalidCredentials() {
        const testName = 'Geçersiz Kimlik Bilgileriyle Login';
        logger.info(`\n📋 Test: ${testName}`);

        const tempAuthService = new AuthService();
        const axios = require('axios');

        try {
            await axios.post(`${config.gateway.httpUrl}/auth/login`, {
                email: 'invalid@test.com',
                password: 'wrongpassword'
            }, { timeout: 5000 });

            // Eğer buraya gelirse, sunucu hata dönmedi
            this.recordResult(testName, false, 'Sunucu geçersiz kimlik bilgilerini kabul etti');
        } catch (error) {
            if (error.response && (error.response.status === 401 || error.response.status === 400)) {
                this.recordResult(testName, true, `Beklenen hata alındı (${error.response.status})`);
            } else {
                this.recordResult(testName, false, error.message);
            }
        }
    }

    /**
     * Test 3: Token yenileme
     */
    async testTokenRefresh() {
        const testName = 'Token Yenileme';
        logger.info(`\n📋 Test: ${testName}`);

        try {
            // İlk token
            const token1 = await this.authService.getToken();

            // Token'ı expire et
            this.authService.tokenExpiry = Date.now() - 1000;

            // Yeni token al
            const token2 = await this.authService.getToken();

            if (token2 && token2.length > 0) {
                this.recordResult(testName, true, 'Token başarıyla yenilendi');
            } else {
                this.recordResult(testName, false, 'Token yenilenemedi');
            }
        } catch (error) {
            this.recordResult(testName, false, error.message);
        }
    }

    /**
     * Test 4: Token süre kontrolü
     */
    async testTokenExpiry() {
        const testName = 'Token Süre Kontrolü';
        logger.info(`\n📋 Test: ${testName}`);

        try {
            // Yeni token al
            await this.authService.login();

            // Süre dolmamış olmalı
            const notExpired = !this.authService.isTokenExpired();

            // Süreyi geçmişe ayarla
            this.authService.tokenExpiry = Date.now() - 1000;

            // Şimdi süre dolmuş olmalı
            const expired = this.authService.isTokenExpired();

            if (notExpired && expired) {
                this.recordResult(testName, true, 'Token süre kontrolü çalışıyor');
            } else {
                this.recordResult(testName, false, `notExpired: ${notExpired}, expired: ${expired}`);
            }
        } catch (error) {
            this.recordResult(testName, false, error.message);
        }
    }

    /**
     * Test 5: Cihaz kaydı
     */
    async testDeviceRegistration() {
        const testName = 'Cihaz Kaydı (Registry ID)';
        logger.info(`\n📋 Test: ${testName}`);

        if (!config.auth.registryId) {
            this.recordResult(testName, false, 'Registry ID tanımlı değil (.env dosyasını kontrol edin)');
            return;
        }

        try {
            const result = await this.authService.registerDevice();

            if (result && result.deviceId) {
                this.recordResult(testName, true, `Device ID: ${result.deviceId}`);
            } else {
                this.recordResult(testName, false, 'Device ID alınamadı');
            }
        } catch (error) {
            // 404 beklenen bir hata olabilir (endpoint mevcut değilse)
            if (error.response?.status === 404) {
                this.recordResult(testName, false, 'Cihaz kayıt endpoint\'i bulunamadı');
            } else {
                this.recordResult(testName, false, error.message);
            }
        }
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
        logger.info('AUTH TEST SONUÇLARI');
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
}

// Doğrudan çalıştırma
if (require.main === module) {
    const test = new AuthTest();
    test.runAllTests()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Test hatası', { error: error.message });
            process.exit(1);
        });
}

module.exports = AuthTest;
