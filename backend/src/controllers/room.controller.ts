import { Request, Response } from "express";
import httpStatus from "http-status";
import playerController from "./player.controller";
import { BINGO_STRIKES_TO_WIN } from "../constants/constant";
import { Room, TurnInfo } from "../types/database.types";
import gameStateManager from "../utils/game-state-redis";

let nanoid: (size?: number) => string;

// Dynamic import for nanoid (ES module)
(async () => {
    const { customAlphabet } = await import("nanoid");
    nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 5);
})();

const createRoom = async (req: Request, res: Response) => {
    const roomId: string = nanoid();
    const playerId: string = req?.body?.playerInfo?.id;
    const playerName: string = req?.body?.playerInfo?.name;
    const maxPlayers: number = parseInt(req?.body?.maxPlayers);
    const roundTime: number = parseInt(req?.body?.roundTime);
    const game: string = req?.body?.game;

    // Create room in Valkey
    const room: Room = {
        id: roomId,
        game,
        maxPlayers,
        roundTime,
        createdAt: new Date().toISOString(),
        isActive: true
    };

    await gameStateManager.createRoom(room);

    // Create player in database
    await playerController.createPlayer(roomId, playerId, playerName);

    return res.status(httpStatus.OK).send({ roomId });
}

const checkRoomExists = async (roomId: string): Promise<boolean> => {
    return await gameStateManager.roomExists(roomId);
}

const joinRoom = async (req: Request, res: Response) => {
    const roomId: string = req?.body?.roomId;
    const playerId: string = req?.body?.playerInfo?.id;
    const playerName: string = req?.body?.playerInfo?.name;

    const isRoomExists = await checkRoomExists(roomId);

    if (!isRoomExists) {
        return res.status(httpStatus.NOT_FOUND).send({ message: "Room doesn't exist" });
    }

    // Check if player already exists in this room
    const isPlayerAlreadyExists = await gameStateManager.playerExistsInRoom(playerId, roomId);

    if (isPlayerAlreadyExists) {
        return res.status(httpStatus.OK).send({ message: "Player already exists!" });
    }

    // Check if room is full
    const room = await gameStateManager.getRoom(roomId);
    const currentPlayerCount = await gameStateManager.getPlayerCount(roomId);

    if (room && currentPlayerCount >= room.maxPlayers) {
        return res.status(httpStatus.BAD_REQUEST).send({ message: "Room is full" });
    }

    // Create player
    await playerController.createPlayer(roomId, playerId, playerName);

    return res.status(httpStatus.OK).send({ message: "Joined room successfully" });
}

const deleteRoomAndPlayers = async (roomId: string) => {
    // Clean up game state
    await gameStateManager.cleanup(roomId);

    // Delete all players from Valkey
    await gameStateManager.deletePlayersByRoom(roomId);

    // Delete room from Valkey
    await gameStateManager.deleteRoom(roomId);
}

const removePlayer = async (playerId: string, roomId: string) => {
    const currentPlayerCount = await gameStateManager.getPlayerCount(roomId);

    if (currentPlayerCount <= 1) {
        // Last player leaving, delete the entire room
        await deleteRoomAndPlayers(roomId);
    } else {
        // Just remove this player
        await playerController.deletePlayer(playerId);

        // Update game state if game is active
        const gameState = await gameStateManager.getGame(roomId);
        if (gameState) {
            const updatedPlayerIds = gameState.playerIds.filter((id: string) => id !== playerId);
            await gameStateManager.updateGame(roomId, { playerIds: updatedPlayerIds });
        }
    }
}

const exitRoom = async (req: Request, res: Response) => {
    let playerId = req?.query?.playerId ?? '';

    if (!playerId) {
        return res.status(httpStatus.BAD_REQUEST).send({ message: "Invalid player ID" });
    }
    playerId = playerId?.toString();

    const player = await playerController.getPlayer(playerId);

    if (!player) {
        return res.status(httpStatus.NOT_FOUND).send({ message: "Player not found" });
    }

    const roomId = player.roomId;
    await removePlayer(playerId, roomId);

    return res.status(httpStatus.OK).send({ message: `Exited from room ${roomId}` });
}

const updateRoomTurn = async (roomId: string, startGame: boolean = false, selectedNumber?: number): Promise<TurnInfo | null> => {
    const players = await gameStateManager.getPlayersByRoom(roomId);

    if (players.length === 0) {
        return null;
    }

    const playerIds = players.map(p => p.id);
    let gameState = await gameStateManager.getGame(roomId);

    if (startGame) {
        if (playerIds.length < 2) {
            return null;
        }

        // Initialize game state
        gameState = await gameStateManager.createGame(roomId, playerIds);
        gameState = await gameStateManager.startGame(roomId);

        if (!gameState) return null;

        return {
            id: gameState.playerIds[0],
            time: gameState.turnTime,
            isFallbackTurn: false
        };
    } else {
        if (!gameState) return null;

        // If no number selected, auto-select a random one (fallback)
        let isFallbackTurn = false;
        if (selectedNumber === undefined) {
            const allNumbers = Array.from(
                { length: BINGO_STRIKES_TO_WIN * BINGO_STRIKES_TO_WIN },
                (_, i) => i + 1
            );
            const availableNumbers = allNumbers.filter(
                num => !gameState!.selectedNumbers.includes(num)
            );

            if (availableNumbers.length > 0) {
                selectedNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
                isFallbackTurn = true;
            }
        }

        // Add selected number and move to next turn
        if (selectedNumber !== undefined) {
            await gameStateManager.addSelectedNumber(roomId, selectedNumber);
        }

        const turnInfo = await gameStateManager.nextTurn(roomId, selectedNumber);

        if (turnInfo) {
            turnInfo.isFallbackTurn = isFallbackTurn;
        }

        return turnInfo || null;
    }
}

const getPlayerRoomDetails = async (req: Request, res: Response) => {
    const playerId = req?.query?.playerId;

    if (!playerId) {
        return res.status(httpStatus.BAD_REQUEST).send({ message: "Player ID is required" });
    }

    const player = await playerController.getPlayer(playerId.toString());

    if (!player) {
        return res.status(httpStatus.NOT_FOUND).send({ message: "Player not found" });
    }

    const roomId = player.roomId;
    const players = await playerController.getPlayersByRoom(roomId);

    const playerArray = players.map(p => ({
        id: p.id,
        name: p.name
    }));

    const gameState = await gameStateManager.getGame(roomId);
    const turn = gameState?.turn ?? 0;

    return res.status(httpStatus.OK).send({
        player_list: playerArray,
        turn: turn
    });
}

export default {
    createRoom,
    joinRoom,
    updateRoomTurn,
    exitRoom,
    getPlayerRoomDetails
}