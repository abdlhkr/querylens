/**
 * Yardımcı fonksiyonlar
 */

/**
 * Belirli süre bekler
 * @param {number} ms - Milisaniye cinsinden bekleme süresi
 * @returns {Promise}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Rastgele bir UUID oluşturur
 * @returns {string} UUID
 */
const generateUuid = () => {
    const { v4: uuidv4 } = require('uuid');
    return uuidv4();
};

/**
 * Tarih formatlar
 * @param {Date} date - Formatlanacak tarih
 * @returns {string} Formatlanmış tarih
 */
const formatDate = (date = new Date()) => {
    return date.toISOString().replace('T', ' ').substr(0, 19);
};

/**
 * JWT token'ı decode eder (verify etmez)
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 */
const decodeJwt = (token) => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }
        const payload = Buffer.from(parts[1], 'base64').toString('utf8');
        return JSON.parse(payload);
    } catch (error) {
        throw new Error(`JWT decode error: ${error.message}`);
    }
};

/**
 * Nesneyi güvenli şekilde JSON'a çevirir
 * @param {Object} obj - Çevrilecek nesne
 * @param {number} indent - Girinti (opsiyonel)
 * @returns {string} JSON string
 */
const safeStringify = (obj, indent = 0) => {
    try {
        return JSON.stringify(obj, null, indent);
    } catch (error) {
        return String(obj);
    }
};

/**
 * Retry mekanizması ile fonksiyon çalıştırır
 * @param {Function} fn - Çalıştırılacak fonksiyon
 * @param {number} maxAttempts - Maksimum deneme sayısı
 * @param {number} delay - Denemeler arası bekleme süresi (ms)
 * @returns {Promise}
 */
const retry = async (fn, maxAttempts = 3, delay = 1000) => {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (attempt < maxAttempts) {
                await sleep(delay * attempt);
            }
        }
    }

    throw lastError;
};

module.exports = {
    sleep,
    generateUuid,
    formatDate,
    decodeJwt,
    safeStringify,
    retry
};
