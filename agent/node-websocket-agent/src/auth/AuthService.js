const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

class AuthService {
    constructor() {
        this.token = null;
        this.tokenExpiry = null;
        this.httpClient = axios.create({
            baseURL: config.gateway.httpUrl,
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
     * Login yaparak JWT token alır
     * @returns {Promise<string>} JWT token
     */
    async login() {
        try {
            logger.info('Login işlemi başlatılıyor...', { email: config.auth.email });

            const response = await this.httpClient.post('/auth/login', {
                email: config.auth.email,
                password: config.auth.password
            });

            this.token = response.data.token || response.data.accessToken;
            this.tokenExpiry = Date.now() + (3600 * 1000); // 1 saat varsayılan

            logger.info('Login başarılı', { tokenLength: this.token?.length });
            return this.token;
        } catch (error) {
            logger.error('Login başarısız', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
            throw error;
        }
    }

    /**
     * Mevcut token'ı döndürür, gerekirse yeniler
     * @returns {Promise<string>} Geçerli JWT token
     */
    async getToken() {
        if (!this.token || this.isTokenExpired()) {
            return await this.login();
        }
        return this.token;
    }

    /**
     * Token'ın süresinin dolup dolmadığını kontrol eder
     */
    isTokenExpired() {
        if (!this.tokenExpiry) return true;
        // 5 dakika önceden yenile
        return Date.now() > (this.tokenExpiry - 5 * 60 * 1000);
    }

    /**
     * Registry ID ile cihaz kaydı yapar
     * @returns {Promise<Object>} Kayıt sonucu (deviceId içerir)
     */
    async registerDevice() {
        try {
            logger.info('Cihaz kaydı başlatılıyor...', { registryId: config.auth.registryId });

            // Registry ID ile cihaz kaydı endpoint'i
            // NOT: Bu endpoint projenize göre değişebilir
            const response = await this.httpClient.post('/auth/device/register', {
                registryId: config.auth.registryId
            });

            const deviceId = response.data.deviceId;
            logger.info('Cihaz kaydı başarılı', { deviceId });

            return {
                deviceId,
                ...response.data
            };
        } catch (error) {
            logger.error('Cihaz kaydı başarısız', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
            throw error;
        }
    }
}

module.exports = AuthService;
