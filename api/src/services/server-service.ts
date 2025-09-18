import redisClient from '../config/redis';
import serverRepository from '../repositories/server-repository';
import redisPublisher from "../utils/redis-publisher";

const THRESHOLD_MS = 6 * 1000; // 6 seconds

const TTL_EXPIRY = 60; // 60 seconds. A safety margin above the threshold, typically 1.5x the threshold.

// Database-matched schema
export interface Server {
    serverId: string;
    serverName: string;
    type: string;
    environment: string;
    version: string;
    port: number;
    lastStarted: number;
    lastHeartbeat: number;
    lastSeenOffline: number | null;
}

// For GET responses that need combined
export interface ServerWithState extends Server {
    playerCount: number;
    playerList: PlayerSession[];
    status: 'online' | 'offline';
}

export interface ServerUpdateRequest {
    playerCount: number;
    lastHeartbeat: number;
    playerList: PlayerSession[];
}

export interface PlayerSession {
    uuid: string;
    username: string;
    joinedAt: number;
    vanished: boolean;
}

class ServerService {

    async getServer(serverId: string): Promise<ServerWithState | null> {
        const redisKey = `environment:${serverId}`;
        const state = await redisClient.hGetAll(redisKey) as Record<string, string>;

        const dbServer = await serverRepository.getServerIfExist(serverId);
        if (!dbServer) {
            return null;
        }

        const redisExists = Object.keys(state).length > 0;

        return {
            ...dbServer,
            playerCount: redisExists ? parseInt(state.playerCount || '0', 10) : 0,
            lastHeartbeat: redisExists
                ? parseInt(state.lastHeartbeat || String(dbServer.lastHeartbeat), 10)
                : dbServer.lastHeartbeat,
            playerList: redisExists ? JSON.parse(state.playerList || '[]') : [],
            status: redisExists ? 'online' : 'offline',
        };
    }

    async getAllServers(): Promise<ServerWithState[]> {
        const dbServers = await serverRepository.getAllServers();
        const results: ServerWithState[] = [];

        for (const dbServer of dbServers) {
            const redisKey = `environment:${dbServer.serverId}`;
            const state = await redisClient.hGetAll(redisKey) as Record<string, string>;
            const redisExists = Object.keys(state).length > 0;

            const serverWithState: ServerWithState = {
                ...dbServer,
                playerCount: redisExists ? parseInt(state.playerCount || '0', 10) : 0,
                lastHeartbeat: redisExists
                    ? parseInt(state.lastHeartbeat || String(dbServer.lastHeartbeat), 10)
                    : dbServer.lastHeartbeat,
                playerList: redisExists ? JSON.parse(state.playerList || '[]') : [],
                status: redisExists ? 'online' : 'offline',
            };

            results.push(serverWithState);
        }

        return results;
    }

    async registerServer(metadata: Server): Promise<void> {
        console.log("Service method");
        const {
            serverId,
            serverName,
            type,
            environment,
            version,
            port
        } = metadata;

        const now = Math.floor(Date.now() / 1000);

        const persistentData: Server = {
            serverId,
            serverName,
            type,
            environment,
            version,
            port: Number(port),
            lastStarted: now,
            lastHeartbeat: now,
            lastSeenOffline: null
        };

        try {
            await serverRepository.insertOrUpdateServer(persistentData);
            console.log(`[MySQL] Server metadata inserted/updated for ${serverId}`);
        } catch (err) {
            console.error('Failed to persist metadata to MySQL:', err);
            return;
        }

        // Initialize volatile runtime state
        const redisKey = `environment:${serverId}`;
        const runtimeState = {
            playerCount: '0',
            lastHeartbeat: String(now),
            playerList: JSON.stringify([]),
        };

        try {
            await redisClient.del(redisKey);
            await redisClient.hSet(redisKey, runtimeState);
            await redisClient.expire(redisKey, TTL_EXPIRY);

            console.log(`[Redis] Initial state stored for ${serverId}`);
        } catch (err) {
            console.error(`Failed to cache initial server state:`, err);
        }
    }

    /*
    Acts as the server update receiver to update necessary things
    Receives playerCount, playerList, lastHeartbeat, as well as the player list PlayerSession items, like uuid, username, joinedAt
     */
    async updateServer(serverId: string, update: ServerUpdateRequest): Promise<void> {
        const redisKey = `environment:${serverId}`;

        try {
            const keyExists = await redisClient.exists(redisKey);
            if (!keyExists) {
                console.warn(`Redis key not found: ${redisKey}`);
                return;
            }

            // Flatten fields to Redis hash
            const redisData: Record<string, string> = {
                playerCount: String(update.playerCount),
                lastHeartbeat: String(update.lastHeartbeat),
                playerList: JSON.stringify(update.playerList),
            };

            await redisClient.hSet(redisKey, redisData);
            await redisClient.expire(redisKey, TTL_EXPIRY);

            console.log(`Updated server state for ${serverId}: ${JSON.stringify(redisData)}`);
        } catch (err) {
            console.error(`Failed to update server state for ${serverId}`, err);
        }
    }
}

export async function checkForDownedServers(): Promise<void> {
    const now = Math.floor(Date.now() / 1000);  // Current timestamp in seconds
    const threshold = THRESHOLD_MS / 1000; // Convert threshold to seconds

    // Fetch all servers from the repository (DB)
    const dbServers = await serverRepository.getAllServers();

    for (const server of dbServers) {
        // Get the Redis key for the server
        const redisKey = `environment:${server.serverId}`;
        const state = await redisClient.hGetAll(redisKey) as Record<string, string>;  // Fetch the server's state from Redis

        // If the server's Redis state is not found, skip the iteration
        if (Object.keys(state).length === 0) {
            continue;
        }

        // Parse the lastHeartbeat from the Redis state or fall back to the DB value
        const lastHeartbeat = parseInt(state.lastHeartbeat || String(server.lastHeartbeat), 10);

        // If the last heartbeat is older than the threshold, mark the server as offline
        if (now - lastHeartbeat > threshold) {
            // Mark the server as offline in the repository (MySQL)
            await serverRepository.markServerOffline(server.serverId, lastHeartbeat, now);

            // Delete the server state from Redis
            await redisClient.del(redisKey);

            console.log(`Server ${server.serverId} has been marked offline and removed from Redis.`);
        }
    }
}

export async function updateGlobalPlayerCounts(): Promise<void> {
    const dbServers = await serverRepository.getAllServers();
    let totalVisible = 0;
    let totalActual = 0;

    for (const server of dbServers) {
        const redisKey = `environment:${server.serverId}`;
        const state = await redisClient.hGetAll(redisKey) as Record<string, string>;

        if (Object.keys(state).length === 0) continue;

        try {
            const players = JSON.parse(state.playerList || '[]') as PlayerSession[];

            const visibleCount = players.filter(p => !p.vanished).length;

            totalVisible += visibleCount;
            totalActual += players.length;
        } catch (err) {
            console.error(`Failed to parse playerList for server ${server.serverId}`, err);
        }
    }

    // Store both visible and actual player counts in Redis
    await redisClient.hSet('global:playerCount', {
        visible: totalVisible.toString(),
        actual: totalActual.toString()
    });

    // Optional: Pub/Sub so Paper servers can push to scoreboards

    await redisPublisher.publish("global.playercount", "api", {visible: totalVisible, actual: totalActual});

    console.log(`[GlobalPlayerCount] Visible: ${totalVisible}, Actual: ${totalActual}`);
}

export default new ServerService();
