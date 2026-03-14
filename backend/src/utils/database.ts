import Database from 'better-sqlite3';
import path from 'path';
import { Room, Player } from '../types/database.types';

const dbPath = path.join(__dirname, '../../bingo.db');
export const db = new Database(dbPath, { verbose: console.log });

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Initialize database tables
export const initializeDatabase = () => {
    // Create rooms table
    db.exec(`
        CREATE TABLE IF NOT EXISTS rooms (
            id TEXT PRIMARY KEY,
            game TEXT NOT NULL,
            maxPlayers INTEGER NOT NULL,
            roundTime INTEGER NOT NULL,
            createdAt TEXT NOT NULL,
            isActive INTEGER DEFAULT 1
        )
    `);

    // Create players table
    db.exec(`
        CREATE TABLE IF NOT EXISTS players (
            id TEXT PRIMARY KEY,
            roomId TEXT NOT NULL,
            name TEXT NOT NULL,
            joinedAt TEXT NOT NULL,
            FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE
        )
    `);

    // Create indexes for better query performance
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_players_roomId ON players(roomId);
        CREATE INDEX IF NOT EXISTS idx_rooms_isActive ON rooms(isActive);
    `);

    console.log('Database initialized successfully');
};

// Room operations
export const roomDb = {
    create: (room: Room) => {
        const stmt = db.prepare(`
            INSERT INTO rooms (id, game, maxPlayers, roundTime, createdAt, isActive)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(room.id, room.game, room.maxPlayers, room.roundTime, room.createdAt, room.isActive ? 1 : 0);
    },

    findById: (id: string): Room | undefined => {
        const stmt = db.prepare('SELECT * FROM rooms WHERE id = ?');
        return stmt.get(id) as Room | undefined;
    },

    exists: (id: string): boolean => {
        const stmt = db.prepare('SELECT 1 FROM rooms WHERE id = ? AND isActive = 1');
        return stmt.get(id) !== undefined;
    },

    update: (id: string, updates: Partial<Room>) => {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        const stmt = db.prepare(`UPDATE rooms SET ${fields} WHERE id = ?`);
        return stmt.run(...values, id);
    },

    delete: (id: string) => {
        const stmt = db.prepare('DELETE FROM rooms WHERE id = ?');
        return stmt.run(id);
    },

    setInactive: (id: string) => {
        const stmt = db.prepare('UPDATE rooms SET isActive = 0 WHERE id = ?');
        return stmt.run(id);
    },

    getPlayerCount: (roomId: string): number => {
        const stmt = db.prepare('SELECT COUNT(*) as count FROM players WHERE roomId = ?');
        const result = stmt.get(roomId) as { count: number };
        return result.count;
    }
};

// Player operations
export const playerDb = {
    create: (player: Player) => {
        const stmt = db.prepare(`
            INSERT INTO players (id, roomId, name, joinedAt)
            VALUES (?, ?, ?, ?)
        `);
        return stmt.run(player.id, player.roomId, player.name, player.joinedAt);
    },

    findById: (id: string): Player | undefined => {
        const stmt = db.prepare('SELECT * FROM players WHERE id = ?');
        return stmt.get(id) as Player | undefined;
    },

    findByRoomId: (roomId: string): Player[] => {
        const stmt = db.prepare('SELECT * FROM players WHERE roomId = ? ORDER BY joinedAt ASC');
        return stmt.all(roomId) as Player[];
    },

    exists: (id: string, roomId: string): boolean => {
        const stmt = db.prepare('SELECT 1 FROM players WHERE id = ? AND roomId = ?');
        return stmt.get(id, roomId) !== undefined;
    },

    delete: (id: string) => {
        const stmt = db.prepare('DELETE FROM players WHERE id = ?');
        return stmt.run(id);
    },

    deleteByRoomId: (roomId: string) => {
        const stmt = db.prepare('DELETE FROM players WHERE roomId = ?');
        return stmt.run(roomId);
    }
};

// Clean up old inactive rooms (older than 24 hours)
export const cleanupOldRooms = () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const stmt = db.prepare(`
        DELETE FROM rooms 
        WHERE isActive = 0 AND createdAt < ?
    `);
    const result = stmt.run(oneDayAgo);
    console.log(`Cleaned up ${result.changes} old rooms`);
};

// Graceful shutdown
export const closeDatabase = () => {
    db.close();
    console.log('Database connection closed');
};

export default db;
