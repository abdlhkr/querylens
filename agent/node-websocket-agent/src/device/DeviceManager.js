const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Cihaz kaydı ve yönetimi
 */
class DeviceManager {
    constructor() {
        this.deviceId = null;
        this.deviceFilePath = path.join(process.cwd(), '.device_id');
        this.deviceInfo = null;
    }

    /**
     * Cihaz ID'sini yükler (dosyadan veya ayarlardan)
     * @returns {string|null} Device ID veya null
     */
    loadDeviceId() {
        // Önce dosyadan dene
        try {
            if (fs.existsSync(this.deviceFilePath)) {
                const savedDeviceId = fs.readFileSync(this.deviceFilePath, 'utf8').trim();
                if (savedDeviceId) {
                    this.deviceId = savedDeviceId;
                    logger.info('Device ID dosyadan yüklendi', { deviceId: this.deviceId });
                    return this.deviceId;
                }
            }
        } catch (error) {
            logger.warn('Device ID dosyası okunamadı', { error: error.message });
        }

        return null;
    }

    /**
     * Device ID'yi dosyaya kaydeder
     * @param {string} deviceId - Kaydedilecek device ID
     */
    saveDeviceId(deviceId) {
        try {
            this.deviceId = deviceId;
            fs.writeFileSync(this.deviceFilePath, deviceId, 'utf8');
            logger.info('Device ID kaydedildi', { deviceId, path: this.deviceFilePath });
        } catch (error) {
            logger.error('Device ID kaydedilemedi', { error: error.message });
            throw error;
        }
    }

    /**
     * Device ID'yi siler
     */
    clearDeviceId() {
        try {
            if (fs.existsSync(this.deviceFilePath)) {
                fs.unlinkSync(this.deviceFilePath);
                logger.info('Device ID silindi');
            }
            this.deviceId = null;
        } catch (error) {
            logger.warn('Device ID silinemedi', { error: error.message });
        }
    }

    /**
     * Mevcut device ID'yi döndürür
     * @returns {string|null}
     */
    getDeviceId() {
        if (!this.deviceId) {
            this.loadDeviceId();
        }
        return this.deviceId;
    }

    /**
     * Registry ID'yi döndürür
     * @returns {string|null}
     */
    getRegistryId() {
        return config.auth.registryId || null;
    }

    /**
     * Cihaz bilgilerini günceller
     * @param {Object} info - Cihaz bilgileri
     */
    updateDeviceInfo(info) {
        this.deviceInfo = {
            ...this.deviceInfo,
            ...info,
            updatedAt: new Date().toISOString()
        };
        logger.debug('Cihaz bilgileri güncellendi', this.deviceInfo);
    }

    /**
     * Cihaz durum bilgisini oluşturur
     * @returns {Object} Durum bilgisi
     */
    getStatusInfo() {
        return {
            deviceId: this.deviceId,
            registryId: this.getRegistryId(),
            info: this.deviceInfo,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Cihazın kayıtlı olup olmadığını kontrol eder
     * @returns {boolean}
     */
    isRegistered() {
        return !!this.getDeviceId();
    }

    /**
     * İlk bağlantı için gerekli bilgileri döndürür
     * @returns {Object} Bağlantı bilgileri
     */
    getConnectionInfo() {
        const deviceId = this.getDeviceId();
        const registryId = this.getRegistryId();

        return {
            deviceId,
            registryId,
            isRegistered: !!deviceId,
            needsRegistration: !deviceId && !!registryId
        };
    }
}

module.exports = DeviceManager;
