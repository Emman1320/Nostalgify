import { Player } from "../types/database.types";
import gameStateManager from "../utils/game-state-redis";

const createPlayer = async (roomId: string, playerId: string, playerName: string): Promise<void> => {
    const player: Player = {
        id: playerId,
        roomId: roomId,
        name: playerName,
        joinedAt: new Date().toISOString()
    };

    // Check if player already exists
    const existingPlayer = await gameStateManager.getPlayer(playerId);
    if (!existingPlayer) {
        await gameStateManager.createPlayer(player);
    }
}

const deletePlayer = async (playerId: string): Promise<void> => {
    await gameStateManager.deletePlayer(playerId);
}

const getPlayer = async (playerId: string): Promise<Player | null> => {
    return await gameStateManager.getPlayer(playerId);
}

const getPlayersByRoom = async (roomId: string): Promise<Player[]> => {
    return await gameStateManager.getPlayersByRoom(roomId);
}

export default {
    createPlayer,
    deletePlayer,
    getPlayer,
    getPlayersByRoom
}