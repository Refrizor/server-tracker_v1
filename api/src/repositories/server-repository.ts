import {Server} from "../services/server-service";
import pool from '../config/mysql';
import { RowDataPacket } from 'mysql2/promise';

interface ServerRow extends RowDataPacket {
    server_id: string;
    server_name: string;
    type: string;
    environment: string;
    version: string;
    port: number;
    last_started: number;
    last_heartbeat: number;
    last_seen_offline: number | null;
}

class ServerRepository {
    /**
     * Insert or update a server in the database.
     * If the `server_id` exists, update the record. Otherwise, insert a new one.
     */
    static async insertOrUpdateServer(data: Server): Promise<void> {
        const query = `
            INSERT INTO servers (server_id,
                                 server_name,
                                 type,
                                 environment,
                                 version,
                                 port,
                                 last_started,
                                 last_heartbeat)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE server_name    = VALUES(server_name),
                                    type           = VALUES(type),
                                    environment    = VALUES(environment),
                                    version        = VALUES(version),
                                    port           = VALUES(port),
                                    last_started   = VALUES(last_started),
                                    last_heartbeat = VALUES(last_heartbeat);
        `;

        const values = [
            data.serverId,
            data.serverName,
            data.type,
            data.environment,
            data.version,
            data.port,
            data.lastStarted,
            data.lastHeartbeat,
        ];

        try {
            const connection = await pool.getConnection();
            await connection.execute(query, values);
            connection.release();
            console.log('Server inserted or updated successfully.');
        } catch (error) {
            console.error('Database operation failed:', error);
            throw error;
        }
    }

    static async getServerIfExist(serverId: string): Promise<Server | null> {
        const query = `
            SELECT server_id,
                   server_name,
                   type,
                   environment,
                   version,
                   port,
                   last_started,
                   last_heartbeat
            FROM servers
            WHERE server_id = ?;
        `;

        try {
            const connection = await pool.getConnection();
            const [rows] = await connection.execute<ServerRow[]>(query, [serverId]);
            connection.release();

            if (rows.length > 0) {
                const row = rows[0];
                return {
                    serverId: row.server_id,
                    serverName: row.server_name,
                    type: row.type,
                    environment: row.environment,
                    version: row.version,
                    port: row.port,
                    lastStarted: row.last_started,
                    lastHeartbeat: row.last_heartbeat,
                    lastSeenOffline: row.last_seen_offline
                };
            }

            return null;
        } catch (error) {
            console.error('Database operation failed:', error);
            throw error;
        }
    }

    static async getAllServers(): Promise<Server[]> {
        const query = `
            SELECT server_id,
                   server_name,
                   type,
                   environment,
                   version,
                   port,
                   last_started,
                   last_heartbeat
            FROM servers;
        `;

        try {
            const connection = await pool.getConnection();
            const [rows] = await connection.execute<ServerRow[]>(query);
            connection.release();

            return rows.map(row => ({
                serverId: row.server_id,
                serverName: row.server_name,
                type: row.type,
                environment: row.environment,
                version: row.version,
                port: row.port,
                lastStarted: row.last_started,
                lastHeartbeat: row.last_heartbeat,
                lastSeenOffline: row.last_seen_offline
            }));
        } catch (error) {
            console.error('Database operation failed:', error);
            throw error;
        }
    }

    static async markServerOffline(serverId: string, lastHeartbeat: number, offlineTimestamp: number): Promise<void> {
        const query = `
        UPDATE servers
        SET last_heartbeat = ?,
            last_seen_offline = ?
        WHERE server_id = ? AND last_seen_offline IS NULL;
    `;

        try {
            const connection = await pool.getConnection();
            const [result] = await connection.execute(query, [lastHeartbeat, offlineTimestamp, serverId]);
            connection.release();

            const affected = (result as any).affectedRows || 0;
            if (affected > 0) {
                console.log(`Marked server ${serverId} as offline at ${offlineTimestamp}`);
            } else {
                console.log(`Server ${serverId} was already marked offline.`);
            }
        } catch (error) {
            console.error(`Failed to mark server ${serverId} as offline:`, error);
            throw error;
        }
    }

    static async getOnlineServers(): Promise<Server[]> {
        const query = `
            SELECT server_id,
                   server_name,
                   type,
                   environment,
                   version,
                   port,
                   last_started,
                   last_heartbeat
            FROM servers
        `;

        try {
            const connection = await pool.getConnection();
            const [rows] = await connection.execute<ServerRow[]>(query);
            connection.release();

            return rows.map(row => ({
                serverId: row.server_id,
                serverName: row.server_name,
                type: row.type,
                environment: row.environment,
                version: row.version,
                port: row.port,
                lastStarted: row.last_started,
                lastHeartbeat: row.last_heartbeat,
                lastSeenOffline: row.last_seen_offline
            }));
        } catch (error) {
            console.error('1 Database operation failed:', error);
            throw error;
        }
    }
}

export default ServerRepository;