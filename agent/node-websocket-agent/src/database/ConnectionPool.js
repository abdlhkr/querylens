const logger = require('../utils/logger');

/**
 * Manages connection pools for user databases
 * Implements hybrid connection pool strategy:
 * - Connections are created on-demand
 * - Idle connections are closed after timeout
 * - Maximum connection limit per database
 */
class ConnectionPool {
    constructor(config = {}) {
        this.pools = new Map(); // databaseId -> pool info
        this.config = {
            maxConnections: config.maxConnections || 5,
            idleTimeoutMs: config.idleTimeoutMs || 30000, // 30 seconds
            acquireTimeoutMs: config.acquireTimeoutMs || 10000,
            ...config
        };

        // Start idle connection cleanup timer
        this.cleanupInterval = setInterval(() => this.cleanupIdleConnections(), 10000);
    }

    /**
     * Get or create a connection for a database
     * @param {string} databaseId - Database connection ID
     * @param {object} connectionInfo - Connection details (host, port, etc.)
     * @param {string} password - Database password (from local storage)
     * @returns {Promise<object>} Database client
     */
    async getConnection(databaseId, connectionInfo, password) {
        let pool = this.pools.get(databaseId);

        if (!pool) {
            pool = {
                connections: [],
                available: [],
                connectionInfo,
                password,
                dbType: connectionInfo.dbType
            };
            this.pools.set(databaseId, pool);
        }

        // Try to get an available connection
        if (pool.available.length > 0) {
            const conn = pool.available.pop();
            conn.lastUsed = Date.now();
            logger.debug('Reusing existing connection', { databaseId });
            return conn.client;
        }

        // Create new connection if under limit
        if (pool.connections.length < this.config.maxConnections) {
            const client = await this.createConnection(connectionInfo, password);
            const connInfo = {
                client,
                createdAt: Date.now(),
                lastUsed: Date.now()
            };
            pool.connections.push(connInfo);
            logger.info('Created new database connection', {
                databaseId,
                totalConnections: pool.connections.length
            });
            return client;
        }

        // Wait for available connection
        logger.warn('Connection pool exhausted, waiting...', { databaseId });
        return this.waitForConnection(databaseId);
    }

    /**
     * Release a connection back to the pool
     * @param {string} databaseId - Database connection ID
     * @param {object} client - Database client to release
     */
    releaseConnection(databaseId, client) {
        const pool = this.pools.get(databaseId);
        if (!pool) return;

        const connInfo = pool.connections.find(c => c.client === client);
        if (connInfo) {
            connInfo.lastUsed = Date.now();
            pool.available.push(connInfo);
            logger.debug('Connection released to pool', { databaseId });
        }
    }

    /**
     * Create a new database connection based on type
     */
    async createConnection(connectionInfo, password) {
        const { dbType, host, port, databaseName, username } = connectionInfo;

        switch (dbType) {
            case 'POSTGRESQL':
                return this.createPostgresConnection(host, port, databaseName, username, password);
            case 'MYSQL':
                return this.createMysqlConnection(host, port, databaseName, username, password);
            case 'MSSQL':
                return this.createMssqlConnection(host, port, databaseName, username, password);
            case 'SQLITE':
                return this.createSqliteConnection(databaseName);
            default:
                throw new Error(`Unsupported database type: ${dbType}`);
        }
    }

    /**
     * Create PostgreSQL connection
     */
    async createPostgresConnection(host, port, database, user, password) {
        const { Client } = require('pg');
        const client = new Client({
            host,
            port,
            database,
            user,
            password,
            connectionTimeoutMillis: this.config.acquireTimeoutMs
        });
        await client.connect();
        return client;
    }

    /**
     * Create MySQL connection
     */
    async createMysqlConnection(host, port, database, user, password) {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host,
            port,
            database,
            user,
            password,
            connectTimeout: this.config.acquireTimeoutMs
        });
        return connection;
    }

    /**
     * Create MSSQL connection
     */
    async createMssqlConnection(host, port, database, user, password) {
        const sql = require('mssql');
        const config = {
            server: host,
            port: parseInt(port),
            database,
            user,
            password,
            options: {
                encrypt: false,
                trustServerCertificate: true
            },
            connectionTimeout: this.config.acquireTimeoutMs
        };
        const pool = await sql.connect(config);
        return pool;
    }

    /**
     * Create SQLite connection
     * Note: SQLite is file-based, so databaseName is the file path
     * Using sql.js (pure JavaScript implementation)
     */
    async createSqliteConnection(databasePath) {
        const initSqlJs = require('sql.js');
        const fs = require('fs');
        const SQL = await initSqlJs();

        let db;
        if (fs.existsSync(databasePath)) {
            const fileBuffer = fs.readFileSync(databasePath);
            db = new SQL.Database(fileBuffer);
        } else {
            db = new SQL.Database();
        }

        // Store the path for saving later
        db._filePath = databasePath;
        return db;
    }

    /**
     * Wait for an available connection
     */
    waitForConnection(databaseId) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const checkInterval = setInterval(() => {
                const pool = this.pools.get(databaseId);

                if (pool && pool.available.length > 0) {
                    clearInterval(checkInterval);
                    const conn = pool.available.pop();
                    conn.lastUsed = Date.now();
                    resolve(conn.client);
                } else if (Date.now() - startTime > this.config.acquireTimeoutMs) {
                    clearInterval(checkInterval);
                    reject(new Error('Connection acquire timeout'));
                }
            }, 100);
        });
    }

    /**
     * Cleanup idle connections
     */
    cleanupIdleConnections() {
        const now = Date.now();

        for (const [databaseId, pool] of this.pools) {
            const idleConnections = pool.available.filter(
                conn => now - conn.lastUsed > this.config.idleTimeoutMs
            );

            for (const conn of idleConnections) {
                try {
                    this.closeConnection(conn.client, pool.dbType);
                    pool.available = pool.available.filter(c => c !== conn);
                    pool.connections = pool.connections.filter(c => c !== conn);
                    logger.debug('Closed idle connection', { databaseId });
                } catch (error) {
                    logger.error('Error closing idle connection', { error: error.message });
                }
            }
        }
    }

    /**
     * Close a database connection
     */
    async closeConnection(client, dbType) {
        try {
            if (dbType === 'POSTGRESQL') {
                await client.end();
            } else if (dbType === 'MYSQL') {
                await client.end();
            } else if (dbType === 'MSSQL') {
                await client.close();
            } else if (dbType === 'SQLITE') {
                client.close();
            }
        } catch (error) {
            logger.error('Error closing connection', { error: error.message });
        }
    }

    /**
     * Close all connections for a database
     */
    async closeAllConnections(databaseId) {
        const pool = this.pools.get(databaseId);
        if (!pool) return;

        for (const conn of pool.connections) {
            await this.closeConnection(conn.client, pool.dbType);
        }

        this.pools.delete(databaseId);
        logger.info('Closed all connections for database', { databaseId });
    }

    /**
     * Shutdown all pools
     */
    async shutdown() {
        clearInterval(this.cleanupInterval);

        for (const databaseId of this.pools.keys()) {
            await this.closeAllConnections(databaseId);
        }

        logger.info('Connection pool shutdown complete');
    }

    /**
     * Test a database connection
     */
    async testConnection(connectionInfo, password) {
        try {
            const client = await this.createConnection(connectionInfo, password);

            // Run a simple test query
            if (connectionInfo.dbType === 'POSTGRESQL') {
                await client.query('SELECT 1');
            } else if (connectionInfo.dbType === 'MYSQL') {
                await client.query('SELECT 1');
            } else if (connectionInfo.dbType === 'MSSQL') {
                await client.request().query('SELECT 1');
            } else if (connectionInfo.dbType === 'SQLITE') {
                client.exec('SELECT 1');
            }

            await this.closeConnection(client, connectionInfo.dbType);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = ConnectionPool;
