const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ConnectionPool = require('./ConnectionPool');
const logger = require('../utils/logger');

function serializeRows(rows) {
    if (!rows) return rows;
    return rows.map(row => {
        const clean = {};
        for (const [key, val] of Object.entries(row)) {
            clean[key] = typeof val === 'bigint' ? val.toString() : val;
        }
        return clean;
    });
}

/**
 * Manages database connections for the agent.
 * - Stores encrypted passwords locally
 * - Handles connection verification
 * - Manages connection pool
 * - Executes queries
 */
class DatabaseManager {
    constructor() {
        this.databases = new Map(); // databaseId -> connection info (no password)
        this.connectionPool = new ConnectionPool();
        const dataDir = process.env.DATA_DIR || process.cwd();
        this.credentialsFile = path.join(dataDir, '.database_credentials.enc');
        this.encryptionKey = this.getOrCreateEncryptionKey();

        this.loadCredentials();
    }

    /**
     * Get or create a machine-specific encryption key
     */
    getOrCreateEncryptionKey() {
        const dataDir = process.env.DATA_DIR || process.cwd();
        const keyFile = path.join(dataDir, '.agent_key');

        if (fs.existsSync(keyFile)) {
            const content = fs.readFileSync(keyFile, 'utf-8').trim();
            // Current format: 64 hex chars (32 random bytes)
            if (/^[0-9a-f]{64}$/i.test(content)) {
                this.restrictPermissions(keyFile);
                return Buffer.from(content, 'hex');
            }
            // Legacy format: 32 raw chars, derived from the machine name.
            // Still usable as an AES-256 key, so old credential files stay readable.
            if (content.length === 32) {
                this.legacyKeyFormat = true;
                this.restrictPermissions(keyFile);
                return Buffer.from(content, 'utf-8');
            }
            logger.warn('Agent key file invalid, regenerating', { keyFile });
        }

        // Random key — never derived from guessable machine data.
        const key = crypto.randomBytes(32);
        fs.writeFileSync(keyFile, key.toString('hex'), { mode: 0o600 });
        this.restrictPermissions(keyFile);
        logger.info('Generated new agent encryption key', { keyFile });

        return key;
    }

    /**
     * Best-effort chmod 600. No-op on filesystems that ignore POSIX modes
     * (Windows drive mounts), so failures are never fatal.
     */
    restrictPermissions(file) {
        try {
            fs.chmodSync(file, 0o600);
        } catch (error) {
            logger.debug('Could not restrict file permissions', { file, error: error.message });
        }
    }

    /**
     * Load encrypted credentials from disk
     */
    loadCredentials() {
        try {
            if (!fs.existsSync(this.credentialsFile)) return;

            const encrypted = fs.readFileSync(this.credentialsFile, 'utf-8').trim();
            if (!encrypted) return;

            const decrypted = this.decrypt(encrypted);
            const credentials = JSON.parse(decrypted);

            for (const [databaseId, cred] of Object.entries(credentials)) {
                this.databases.set(databaseId, cred);
            }

            logger.info('Loaded database credentials', { count: this.databases.size });

            // Re-write old CBC files in the authenticated GCM format.
            if (this.legacyCiphertext) {
                this.legacyCiphertext = false;
                this.saveCredentials();
                logger.info('Upgraded credential store to AES-256-GCM');
            } else {
                this.restrictPermissions(this.credentialsFile);
            }
        } catch (error) {
            logger.warn('Failed to load credentials', { error: error.message });
        }
    }

    /**
     * Save encrypted credentials to disk
     */
    saveCredentials() {
        try {
            const credentials = {};
            for (const [databaseId, cred] of this.databases) {
                credentials[databaseId] = cred;
            }

            const encrypted = this.encrypt(JSON.stringify(credentials));
            fs.writeFileSync(this.credentialsFile, encrypted, { mode: 0o600 });
            this.restrictPermissions(this.credentialsFile);

            logger.debug('Saved database credentials');
        } catch (error) {
            logger.error('Failed to save credentials', { error: error.message });
        }
    }

    /**
     * Encrypt with AES-256-GCM.
     * Format: v2:<iv>:<authTag>:<ciphertext>  (all hex)
     * GCM authenticates the ciphertext, so tampering is detected on read —
     * unlike the old CBC format, which was malleable.
     */
    encrypt(text) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
        const encrypted = Buffer.concat([cipher.update(text, 'utf-8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        return ['v2', iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
    }

    /**
     * Decrypt both the current GCM format and the legacy CBC format
     * (<iv>:<ciphertext>), so existing credential files keep working.
     */
    decrypt(text) {
        const parts = text.split(':');

        if (parts[0] === 'v2') {
            const [, ivHex, tagHex, dataHex] = parts;
            const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, Buffer.from(ivHex, 'hex'));
            decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
            return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf-8');
        }

        // Legacy AES-256-CBC
        this.legacyCiphertext = true;
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, Buffer.from(parts[0], 'hex'));
        return Buffer.concat([decipher.update(Buffer.from(parts[1], 'hex')), decipher.final()]).toString('utf-8');
    }

    /**
     * Handle new database notification from server
     * @param {object} message - New database message
     */
    async handleNewDatabase(message) {
        const { databaseId, host, port, databaseName, username, dbType } = message;

        // Use existing credentials if available (e.g. after agent reconnect)
        const existing = this.databases.get(databaseId);
        if (existing) {
            logger.info('🔄 Mevcut credentials kullanılıyor, şifre sorulmayacak', { databaseId });

            const testResult = await this.connectionPool.testConnection(
                { host, port, databaseName, username, dbType },
                existing.password
            );

            if (testResult.success) {
                this.databases.set(databaseId, {
                    ...existing,
                    host, port, databaseName, username, dbType,
                    verifiedAt: new Date().toISOString()
                });
                this.saveCredentials();
                logger.info('✅ Database yeniden doğrulandı', { databaseId });
                return { success: true, databaseId };
            } else {
                logger.error('❌ Mevcut credentials ile bağlantı başarısız', { error: testResult.error });
                return { success: false, error: testResult.error };
            }
        }

        // Docker içinde çalışıyorsa localhost → host.docker.internal
        const resolvedHost = (process.env.RUNNING_IN_DOCKER === 'true' && host === 'localhost')
            ? 'host.docker.internal'
            : host;

        if (resolvedHost !== host) {
            logger.info('🐳 Docker modunda localhost → host.docker.internal olarak çözüldü');
        }

        logger.info('📂 Yeni database eklendi, bağlantı test ediliyor', {
            databaseId,
            host: resolvedHost,
            port,
            databaseName,
            dbType
        });

        const password = message.password;

        if (!password) {
            logger.error('❌ Mesajda şifre yok');
            return { success: false, error: 'No password provided' };
        }

        // Test connection
        const testResult = await this.connectionPool.testConnection(
            { host: resolvedHost, port, databaseName, username, dbType },
            password
        );

        if (testResult.success) {
            // Save credentials locally
            this.databases.set(databaseId, {
                host: resolvedHost,
                port,
                databaseName,
                username,
                dbType,
                password,
                verifiedAt: new Date().toISOString()
            });
            this.saveCredentials();

            logger.info('✅ Database bağlantısı doğrulandı', { databaseId });
            return { success: true, databaseId };
        } else {
            logger.error('❌ Database bağlantısı başarısız', { error: testResult.error });
            return { success: false, error: testResult.error };
        }
    }

    /**
     * Execute a query on a database
     * @param {string} databaseId - Database ID
     * @param {string} query - SQL query to execute
     * @returns {Promise<object>} Query result
     */
    async executeQuery(databaseId, query) {
        const dbInfo = this.databases.get(databaseId);

        
        if (!dbInfo) {
            throw new Error(`Database not found: ${databaseId}. Please verify connection first.`);
        }

        const startTime = Date.now();

        try {
            const client = await this.connectionPool.getConnection(
                databaseId,
                {
                    host: dbInfo.host,
                    port: dbInfo.port,
                    databaseName: dbInfo.databaseName,
                    username: dbInfo.username,
                    dbType: dbInfo.dbType
                },
                dbInfo.password
            );

            let result;

            if (dbInfo.dbType === 'POSTGRESQL') {
                const queryResult = await client.query(query);
                result = {
                    rows: queryResult.rows,
                    rowCount: queryResult.rowCount,
                    fields: queryResult.fields?.map(f => f.name)
                };
            } else if (dbInfo.dbType === 'MYSQL') {
                const [rows, fields] = await client.query(query);
                result = {
                    rows,
                    rowCount: rows.length,
                    fields: fields?.map(f => f.name)
                };
            } else if (dbInfo.dbType === 'MSSQL') {
                const queryResult = await client.request().query(query);
                result = {
                    rows: serializeRows(queryResult.recordset),
                    rowCount: queryResult.rowsAffected?.[0] || queryResult.recordset?.length || 0,
                    fields: queryResult.recordset?.columns ? Object.keys(queryResult.recordset.columns) : []
                };
            } else if (dbInfo.dbType === 'SQLITE') {
                const queryResult = client.exec(query);
                // sql.js returns an array of result sets
                const firstResult = queryResult[0] || { columns: [], values: [] };
                // Convert values array to row objects
                const rows = firstResult.values.map(row => {
                    const obj = {};
                    firstResult.columns.forEach((col, idx) => {
                        obj[col] = row[idx];
                    });
                    return obj;
                });
                result = {
                    rows,
                    rowCount: rows.length,
                    fields: firstResult.columns
                };
            }

            this.connectionPool.releaseConnection(databaseId, client);

            const executionTime = Date.now() - startTime;
            logger.info('Query executed', { databaseId, executionTime, rowCount: result.rowCount });

            return {
                success: true,
                data: result.rows,
                rowCount: result.rowCount,
                executionTimeMs: executionTime
            };
        } catch (error) {
            logger.error('Query execution failed', { databaseId, error: error.message });
            throw error;
        }
    }

    /**
     * Handle database deleted notification
     * @param {string} databaseId - Database ID
     */
    async handleDatabaseDeleted(databaseId) {
        await this.connectionPool.closeAllConnections(databaseId);
        this.databases.delete(databaseId);
        this.saveCredentials();

        logger.info('Database removed', { databaseId });
    }

    /**
     * Check if we have credentials for a database
     * @param {string} databaseId - Database ID
     * @returns {boolean}
     */
    hasCredentials(databaseId) {
        return this.databases.has(databaseId);
    }

    /**
     * Get list of verified databases
     * @returns {Array} List of database IDs
     */
    getVerifiedDatabases() {
        return Array.from(this.databases.keys());
    }

    /**
     * Shutdown database manager
     */
    async shutdown() {
        await this.connectionPool.shutdown();
        logger.info('Database manager shutdown complete');
    }
}

module.exports = DatabaseManager;
