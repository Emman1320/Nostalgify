import { createClient, RedisClientType } from 'redis';
import { GameState, TurnInfo, Room, Player } from '../types/database.types';
import { VALKEY_KEY_EXPIRY_SECONDS } from '../constants/constant';

// Valkey/Redis client (Valkey is Redis-compatible)
let redisClient: RedisClientType;

// Initialize Valkey/Redis connection
export const initializeRedis = async (): Promise<void> => {
    const connectionUrl = process.env.VALKEY_URL || process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = createClient({
        url: connectionUrl,
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 10) {
                    console.error('Valkey: Too many reconnection attempts');
                    return new Error('Too many retries');
                }
                return Math.min(retries * 100, 3000);
            }
        }
    });

    redisClient.on('error', (err) => console.error('Valkey Client Error:', err));
    redisClient.on('connect', () => console.log('Valkey: Connected'));
    redisClient.on('reconnecting', () => console.log('Valkey: Reconnecting...'));
    redisClient.on('ready', () => console.log('Valkey: Ready'));

    await redisClient.connect();
};

// Close Valkey/Redis connection
export const closeRedis = async (): Promise<void> => {
    if (redisClient) {
        await redisClient.quit();
    }
};

// Valkey key prefixes
const KEYS = {
    ROOM: (roomId: string) => `room:${roomId}`,
    ROOM_PLAYERS: (roomId: string) => `room:${roomId}:players`,
    PLAYER: (playerId: string) => `player:${playerId}`,
    GAME: (roomId: string) => `game:${roomId}`,
    CHAT: (roomId: string) => `chat:${roomId}`,
    PLAYER_TO_SOCKET: (playerId: string) => `p2s:${playerId}`,
    SOCKET_TO_PLAYER: (socketId: string) => `s2p:${socketId}`,
    ALL_ROOMS: 'rooms:all'
};

type RoomChatMessage = {
    playerId: string;
    playerName: string;
    message: string;
    timestamp: string;
};

// Timeout tracking (still in-memory because NodeJS.Timeout can't be serialized)
const playerTimeouts = new Map<string, NodeJS.Timeout>();

export const gameStateManager = {
    // Game state operations
    createGame: async (roomId: string, playerIds: string[]): Promise<GameState> => {
        const gameState: GameState = {
            roomId,
            turn: 0,
            turnTime: new Date().toISOString(),
            selectedNumbers: [],
            playerIds,
            isGameStarted: false
        };

        // Store game state in Redis with TTL
        await redisClient.set(KEYS.GAME(roomId), JSON.stringify(gameState), { EX: VALKEY_KEY_EXPIRY_SECONDS });

        return gameState;
    },

    getGame: async (roomId: string): Promise<GameState | undefined> => {
        const data = await redisClient.get(KEYS.GAME(roomId));
        return data ? JSON.parse(data) : undefined;
    },

    updateGame: async (roomId: string, updates: Partial<GameState>): Promise<GameState | undefined> => {
        const game = await gameStateManager.getGame(roomId);
        if (!game) return undefined;

        const updatedGame = { ...game, ...updates };
        await redisClient.set(KEYS.GAME(roomId), JSON.stringify(updatedGame), { EX: VALKEY_KEY_EXPIRY_SECONDS });
        return updatedGame;
    },

    deleteGame: async (roomId: string): Promise<boolean> => {
        const deleted = await redisClient.del(KEYS.GAME(roomId));
        return deleted > 0;
    },

    startGame: async (roomId: string): Promise<GameState | undefined> => {
        const game = await gameStateManager.getGame(roomId);
        if (!game) return undefined;

        game.isGameStarted = true;
        game.turn = 0;
        game.turnTime = new Date().toISOString();

        await redisClient.set(KEYS.GAME(roomId), JSON.stringify(game), { EX: VALKEY_KEY_EXPIRY_SECONDS });
        return game;
    },

    nextTurn: async (roomId: string, selectedNumber?: number): Promise<TurnInfo | undefined> => {
        const game = await gameStateManager.getGame(roomId);
        if (!game) return undefined;

        // Update selected numbers if provided
        if (selectedNumber !== undefined && !game.selectedNumbers.includes(selectedNumber)) {
            game.selectedNumbers.push(selectedNumber);
        }

        // Move to next player
        game.turn = (game.turn + 1) % game.playerIds.length;
        game.turnTime = new Date().toISOString();

        await redisClient.set(KEYS.GAME(roomId), JSON.stringify(game), { EX: VALKEY_KEY_EXPIRY_SECONDS });

        return {
            id: game.playerIds[game.turn],
            time: game.turnTime,
            selectedNumber,
            isFallbackTurn: false
        };
    },

    getCurrentTurn: async (roomId: string): Promise<TurnInfo | undefined> => {
        const game = await gameStateManager.getGame(roomId);
        if (!game) return undefined;

        return {
            id: game.playerIds[game.turn],
            time: game.turnTime
        };
    },

    addSelectedNumber: async (roomId: string, number: number): Promise<void> => {
        const game = await gameStateManager.getGame(roomId);
        if (game && !game.selectedNumbers.includes(number)) {
            game.selectedNumbers.push(number);
            await redisClient.set(KEYS.GAME(roomId), JSON.stringify(game), { EX: VALKEY_KEY_EXPIRY_SECONDS });
        }
    },

    getSelectedNumbers: async (roomId: string): Promise<number[]> => {
        const game = await gameStateManager.getGame(roomId);
        return game?.selectedNumbers || [];
    },

    // Timeout management (still in-memory as NodeJS.Timeout cannot be serialized)
    setPlayerTimeout: (playerId: string, timeout: NodeJS.Timeout): void => {
        // Clear existing timeout if any
        const existing = playerTimeouts.get(playerId);
        if (existing) {
            clearTimeout(existing);
        }
        playerTimeouts.set(playerId, timeout);
    },

    clearPlayerTimeout: (playerId: string): void => {
        const timeout = playerTimeouts.get(playerId);
        if (timeout) {
            clearTimeout(timeout);
            playerTimeouts.delete(playerId);
        }
    },

    clearAllTimeouts: async (roomId: string): Promise<void> => {
        const game = await gameStateManager.getGame(roomId);
        if (game) {
            game.playerIds.forEach(playerId => {
                gameStateManager.clearPlayerTimeout(playerId);
            });
        }
    },

    // Socket ID mappings
    mapPlayerToSocket: async (playerId: string, socketId: string): Promise<void> => {
        await redisClient.set(KEYS.PLAYER_TO_SOCKET(playerId), socketId, { EX: VALKEY_KEY_EXPIRY_SECONDS });
        await redisClient.set(KEYS.SOCKET_TO_PLAYER(socketId), playerId, { EX: VALKEY_KEY_EXPIRY_SECONDS });
    },

    unmapPlayerSocket: async (playerId: string, socketId: string): Promise<void> => {
        await redisClient.del(KEYS.PLAYER_TO_SOCKET(playerId));
        await redisClient.del(KEYS.SOCKET_TO_PLAYER(socketId));
    },

    getSocketIdByPlayerId: async (playerId: string): Promise<string | null> => {
        return await redisClient.get(KEYS.PLAYER_TO_SOCKET(playerId));
    },

    getPlayerIdBySocketId: async (socketId: string): Promise<string | null> => {
        return await redisClient.get(KEYS.SOCKET_TO_PLAYER(socketId));
    },

    // Cleanup
    cleanup: async (roomId: string): Promise<void> => {
        const game = await gameStateManager.getGame(roomId);
        if (game) {
            // Clear all timeouts for this room
            await gameStateManager.clearAllTimeouts(roomId);

            // Remove socket mappings
            for (const playerId of game.playerIds) {
                const socketId = await redisClient.get(KEYS.PLAYER_TO_SOCKET(playerId));
                if (socketId) {
                    await gameStateManager.unmapPlayerSocket(playerId, socketId);
                }
            }

            // Delete the game
            await gameStateManager.deleteGame(roomId);
        }
    },

    // Get all active rooms (useful for debugging)
    getAllRooms: async (): Promise<string[]> => {
        return await redisClient.sMembers(KEYS.ALL_ROOMS);
    },

    // Health check
    isConnected: (): boolean => {
        return redisClient?.isOpen || false;
    },

    // ========== ROOM MANAGEMENT ==========
    createRoom: async (room: Room): Promise<void> => {
        await redisClient.set(KEYS.ROOM(room.id), JSON.stringify(room), { EX: VALKEY_KEY_EXPIRY_SECONDS });
        await redisClient.sAdd(KEYS.ALL_ROOMS, room.id);
        await redisClient.expire(KEYS.ALL_ROOMS, VALKEY_KEY_EXPIRY_SECONDS);
    },

    getRoom: async (roomId: string): Promise<Room | null> => {
        const data = await redisClient.get(KEYS.ROOM(roomId));
        if (!data) return null;
        // Refresh TTL on access
        await redisClient.expire(KEYS.ROOM(roomId), VALKEY_KEY_EXPIRY_SECONDS);
        return JSON.parse(data);
    },

    roomExists: async (roomId: string): Promise<boolean> => {
        return await redisClient.exists(KEYS.ROOM(roomId)) > 0;
    },

    deleteRoom: async (roomId: string): Promise<void> => {
        await redisClient.del(KEYS.ROOM(roomId));
        await redisClient.sRem(KEYS.ALL_ROOMS, roomId);
        await redisClient.del(KEYS.ROOM_PLAYERS(roomId));
        await redisClient.del(KEYS.CHAT(roomId));
    },

    refreshRoomTTL: async (roomId: string): Promise<void> => {
        await redisClient.expire(KEYS.ROOM(roomId), VALKEY_KEY_EXPIRY_SECONDS);
        await redisClient.expire(KEYS.ROOM_PLAYERS(roomId), VALKEY_KEY_EXPIRY_SECONDS);
    },

    // ========== PLAYER MANAGEMENT ==========
    createPlayer: async (player: Player): Promise<void> => {
        await redisClient.set(KEYS.PLAYER(player.id), JSON.stringify(player), { EX: VALKEY_KEY_EXPIRY_SECONDS });
        await redisClient.sAdd(KEYS.ROOM_PLAYERS(player.roomId), player.id);
        await redisClient.expire(KEYS.ROOM_PLAYERS(player.roomId), VALKEY_KEY_EXPIRY_SECONDS);
        // Refresh room TTL when player joins
        await gameStateManager.refreshRoomTTL(player.roomId);
    },

    getPlayer: async (playerId: string): Promise<Player | null> => {
        const data = await redisClient.get(KEYS.PLAYER(playerId));
        if (!data) return null;
        // Refresh TTL on access
        await redisClient.expire(KEYS.PLAYER(playerId), VALKEY_KEY_EXPIRY_SECONDS);
        return JSON.parse(data);
    },

    getPlayersByRoom: async (roomId: string): Promise<Player[]> => {
        const playerIds = await redisClient.sMembers(KEYS.ROOM_PLAYERS(roomId));
        const players: Player[] = [];

        for (const playerId of playerIds) {
            const player = await gameStateManager.getPlayer(playerId);
            if (player) {
                players.push(player);
            }
        }

        // Refresh room TTL on access
        await gameStateManager.refreshRoomTTL(roomId);
        return players.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
    },

    getPlayerCount: async (roomId: string): Promise<number> => {
        return await redisClient.sCard(KEYS.ROOM_PLAYERS(roomId));
    },

    deletePlayer: async (playerId: string): Promise<void> => {
        const player = await gameStateManager.getPlayer(playerId);
        if (player) {
            await redisClient.sRem(KEYS.ROOM_PLAYERS(player.roomId), playerId);
        }
        await redisClient.del(KEYS.PLAYER(playerId));
    },

    deletePlayersByRoom: async (roomId: string): Promise<void> => {
        const playerIds = await redisClient.sMembers(KEYS.ROOM_PLAYERS(roomId));
        for (const playerId of playerIds) {
            await redisClient.del(KEYS.PLAYER(playerId));
        }
        await redisClient.del(KEYS.ROOM_PLAYERS(roomId));
    },

    playerExistsInRoom: async (playerId: string, roomId: string): Promise<boolean> => {
        return await redisClient.sIsMember(KEYS.ROOM_PLAYERS(roomId), playerId);
    },

    addChatMessage: async (roomId: string, chatMessage: RoomChatMessage): Promise<void> => {
        await redisClient.rPush(KEYS.CHAT(roomId), JSON.stringify(chatMessage));
        await redisClient.lTrim(KEYS.CHAT(roomId), -200, -1);
        await redisClient.expire(KEYS.CHAT(roomId), VALKEY_KEY_EXPIRY_SECONDS);
    },

    getChatMessages: async (roomId: string): Promise<RoomChatMessage[]> => {
        const messages = await redisClient.lRange(KEYS.CHAT(roomId), 0, -1);
        await redisClient.expire(KEYS.CHAT(roomId), VALKEY_KEY_EXPIRY_SECONDS);
        return messages.map((value) => JSON.parse(value) as RoomChatMessage);
    }
};

export default gameStateManager;
