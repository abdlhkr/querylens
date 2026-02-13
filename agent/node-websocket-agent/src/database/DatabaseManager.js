const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const ConnectionPool = require('./ConnectionPool');
const logger = require('../utils/logger');

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
        this.credentialsFile = path.join(process.cwd(), '.database_credentials.enc');
        this.encryptionKey = this.getOrCreateEncryptionKey();

        this.loadCredentials();
    }

    /**
     * Get or create a machine-specific encryption key
     */
    getOrCreateEncryptionKey() {
        const keyFile = path.join(process.cwd(), '.agent_key');

        if (fs.existsSync(keyFile)) {
            return fs.readFileSync(keyFile, 'utf-8');
        }

        // Generate new key based on machine ID
        const machineId = require('os').hostname() + process.env.USERNAME || 'default';
        const key = crypto.createHash('sha256').update(machineId + 'agent-salt').digest('hex').substring(0, 32);
        fs.writeFileSync(keyFile, key, { mode: 0o600 });

        return key;
    }

    /**
     * Load encrypted credentials from disk
     */
    loadCredentials() {
        try {
            if (fs.existsSync(this.credentialsFile)) {
                const encrypted = fs.readFileSync(this.credentialsFile, 'utf-8');
                const decrypted = this.decrypt(encrypted);
                const credentials = JSON.parse(decrypted);

                for (const [databaseId, cred] of Object.entries(credentials)) {
                    this.databases.set(databaseId, cred);
                }

                logger.info('Loaded database credentials', { count: this.databases.size });
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

            logger.debug('Saved database credentials');
        } catch (error) {
            logger.error('Failed to save credentials', { error: error.message });
        }
    }

    /**
     * Encrypt data using AES-256
     */
    encrypt(text) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

    /**
     * Decrypt data using AES-256
     */
    decrypt(text) {
        const parts = text.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = Buffer.from(parts[1], 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }

    /**
     * Handle new database notification from server
     * @param {object} message - New database message
     */
    async handleNewDatabase(message) {
        const { databaseId, host, port, databaseName, username, dbType } = message;

        logger.info('📂 Yeni database eklendi, doğrulama bekleniyor', {
            databaseId,
            host,
            port,
            databaseName,
            dbType
        });

        // Prompt user for password
        const password = await this.promptForPassword(host, port, databaseName);

        if (!password) {
            logger.warn('Password girişi iptal edildi');
            return { success: false, error: 'Password entry cancelled' };
        }

        // Test connection
        const testResult = await this.connectionPool.testConnection(
            { host, port, databaseName, username, dbType },
            password
        );

        if (testResult.success) {
            // Save credentials locally
            this.databases.set(databaseId, {
                host,
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
     * Prompt user for database password via console
     */
    promptForPassword(host, port, databaseName) {
        return new Promise((resolve) => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            console.log('\n' + '='.repeat(50));
            console.log(`🔐 Database şifresi gerekli:`);
            console.log(`   Host: ${host}:${port}`);
            console.log(`   Database: ${databaseName}`);
            console.log('='.repeat(50));

            // Hide password input
            const stdin = process.stdin;
            const originalWrite = process.stdout.write.bind(process.stdout);

            rl.question('Şifre: ', (password) => {
                rl.close();
                console.log(); // New line after password
                resolve(password);
            });

            // Note: For true password hiding, you'd need a package like 'readline-sync'
            // This is a simplified version
        });
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
                    rows: queryResult.recordset,
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
