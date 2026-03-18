import { Server, Socket } from "socket.io";
import roomController from "../controllers/room.controller";
import playerController from "../controllers/player.controller";
import { SocketChannels } from "../constants/enum";
import gameStateManager from "./game-state-redis";

const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const io = new Server({
    path: process.env.SOCKET_PATH || "/socket.io",
    cors: {
        origin: corsOrigins,
        methods: ["GET", "POST"],
        credentials: false
    },
});

const roomStartLocks = new Set<string>();

const changeTurn = async (roomId: string, roundTime: number, selectedNumber?: number) => {
    const nextTurnInfo = await roomController.updateRoomTurn(roomId, false, selectedNumber);

    if (!nextTurnInfo) {
        console.error("Failed to update turn for room:", roomId);
        return null;
    }

    const turnPayload = {
        ...nextTurnInfo,
        roundTime
    };
    io.to(roomId).emit(SocketChannels.TURN, turnPayload);
    return turnPayload;
}

const setTimeoutForPlayer = (roomId: string, playerId: string, roundTime: number) => {
    const timeout = setTimeout(async () => {
        // Clear the timeout for the player whose turn just expired
        gameStateManager.clearPlayerTimeout(playerId);

        // Auto-advance turn without a selected number (will pick random)
        const nextTurnInfo = await changeTurn(roomId, roundTime);

        // Recursively set timeout for the next player
        if (nextTurnInfo) {
            setTimeoutForPlayer(roomId, nextTurnInfo.id, roundTime);
        }
    }, roundTime * 1000);

    gameStateManager.setPlayerTimeout(playerId, timeout);
};

const socketListeners = (socket: Socket, roomId: string, playerId: string, roundTime: number) => {
    // Turn event
    socket.on(SocketChannels.TURN, async (message: { selectedNumber?: number }) => {
        const currentGame = await gameStateManager.getGame(roomId);

        if (!currentGame || !currentGame.isGameStarted || currentGame.playerIds.length === 0) {
            return;
        }

        const currentTurnPlayerId = currentGame.playerIds[currentGame.turn];
        if (currentTurnPlayerId !== playerId) {
            return;
        }

        // Clear existing timeout for this player
        gameStateManager.clearPlayerTimeout(playerId);

        const nextTurnInfo = await changeTurn(roomId, roundTime, message?.selectedNumber);

        if (nextTurnInfo) {
            // Set timeout for next player
            setTimeoutForPlayer(roomId, nextTurnInfo.id, roundTime);
        }
    });

    // Start game event
    socket.on(SocketChannels.START_GAME, async () => {
        if (roomStartLocks.has(roomId)) {
            return;
        }

        roomStartLocks.add(roomId);
        try {
            const currentGame = await gameStateManager.getGame(roomId);
            if (currentGame?.isGameStarted) {
                return;
            }

            await gameStateManager.clearAllTimeouts(roomId);

            const nextTurnInfo = await roomController.updateRoomTurn(roomId, true);

            if (!nextTurnInfo) {
                console.error("Failed to start game for room:", roomId);
                return;
            }

            io.to(roomId).emit(SocketChannels.START_GAME, {
                ...nextTurnInfo,
                roundTime
            });

            // Set timeout for first player's turn
            setTimeoutForPlayer(roomId, nextTurnInfo.id, roundTime);
        } finally {
            roomStartLocks.delete(roomId);
        }
    });

    // Winner event — relay to all players in the room
    socket.on(SocketChannels.WINNER, async (data: { winnerId: string; winnerName: string }) => {
        // Clear all timeouts for the room
        await gameStateManager.clearAllTimeouts(roomId);

        // Broadcast winner to all players in the room
        io.to(roomId).emit(SocketChannels.WINNER, data);

        // Clean up only current round state. Keep room and players for replay.
        await gameStateManager.deleteGame(roomId);
    });

    // Chat message — relay to all players in the room
    socket.on(SocketChannels.CHAT_MESSAGE, async (message: { playerId: string; playerName: string; message: string; timestamp: string }) => {
        const roomMessage = {
            playerId: message.playerId,
            playerName: message.playerName,
            message: message.message,
            timestamp: message.timestamp || new Date().toISOString()
        };

        await gameStateManager.addChatMessage(roomId, roomMessage);
        io.to(roomId).emit(SocketChannels.CHAT_MESSAGE, roomMessage);
    });

    // Strike update — relay live strike count to all players in the room
    socket.on(SocketChannels.STRIKE_UPDATE, (message: { playerId: string; strikes: number }) => {
        io.to(roomId).emit(SocketChannels.STRIKE_UPDATE, message);
    });

    // Replay round — relay to all players in the room to return to waiting room
    socket.on(SocketChannels.REPLAY_ROUND, async () => {
        await gameStateManager.clearAllTimeouts(roomId);
        await gameStateManager.deleteGame(roomId);
        io.to(roomId).emit(SocketChannels.REPLAY_ROUND);
    });

    // Disconnect — clean up player socket mapping and handle mid-game disconnect
    socket.on("disconnect", async () => {
        const disconnectedPlayerId = await gameStateManager.getPlayerIdBySocketId(socket.id);

        if (!disconnectedPlayerId) return;

        // Clear any active timeouts for this player
        gameStateManager.clearPlayerTimeout(disconnectedPlayerId);

        // Unmap the socket
        await gameStateManager.unmapPlayerSocket(disconnectedPlayerId, socket.id);

        // Check if a game is active
        const gameState = await gameStateManager.getGame(roomId);

        if (gameState && gameState.isGameStarted) {
            // Check if it was this player's turn
            const currentTurnPlayerId = gameState.playerIds[gameState.turn];

            // Remove disconnected player from game
            const updatedPlayerIds = gameState.playerIds.filter(id => id !== disconnectedPlayerId);

            if (updatedPlayerIds.length < 2) {
                // Not enough players to continue — end the game
                await gameStateManager.clearAllTimeouts(roomId);

                // Remaining player is notified that no opponents are left
                if (updatedPlayerIds.length === 1) {
                    io.to(roomId).emit(SocketChannels.LAST_PLAYER_STANDING);
                }

                await gameStateManager.deleteGame(roomId);
                await gameStateManager.deletePlayersByRoom(roomId);
                await gameStateManager.deleteRoom(roomId);
            } else {
                // Adjust turn index if needed
                let newTurn = gameState.turn;
                const disconnectedIndex = gameState.playerIds.indexOf(disconnectedPlayerId);
                if (disconnectedIndex < gameState.turn) {
                    newTurn = gameState.turn - 1;
                } else if (disconnectedIndex === gameState.turn) {
                    newTurn = gameState.turn % updatedPlayerIds.length;
                }
                // Ensure turn is within bounds
                newTurn = newTurn % updatedPlayerIds.length;

                await gameStateManager.updateGame(roomId, {
                    playerIds: updatedPlayerIds,
                    turn: newTurn
                });

                // If it was the disconnected player's turn, advance to next
                if (currentTurnPlayerId === disconnectedPlayerId) {
                    const game = await gameStateManager.getGame(roomId);
                    if (game) {
                        const nextPlayerId = game.playerIds[game.turn];
                        const turnInfo = {
                            id: nextPlayerId,
                            time: new Date().toISOString(),
                            isFallbackTurn: false,
                            roundTime
                        };
                        io.to(roomId).emit(SocketChannels.TURN, turnInfo);

                        // Set timeout for next player
                        setTimeoutForPlayer(roomId, nextPlayerId, roundTime);
                    }
                }
            }
        }

        // Notify remaining players that someone left
        const remainingPlayers = await playerController.getPlayersByRoom(roomId);
        const playerArray = remainingPlayers
            .filter(p => p.id !== disconnectedPlayerId)
            .map(p => ({ id: p.id, name: p.name }));
        io.to(roomId).emit(SocketChannels.PLAYER_JOINED, { playerArray });
    });
}

// When a player joins the room server
io.on("connection", async (socket) => {
    const playerId = socket.handshake.query?.playerId;

    if (!playerId) {
        console.error("Connection without player ID");
        return;
    }

    const playerIdStr = playerId.toString();

    // Map player to socket
    await gameStateManager.mapPlayerToSocket(playerIdStr, socket.id);

    // Get player info from database
    const player = await playerController.getPlayer(playerIdStr);

    if (!player) {
        console.error("Player not found:", playerIdStr);
        return;
    }

    const roomId = player.roomId;

    // Join the room
    await socket.join(roomId);

    // Get all players in the room
    const players = await playerController.getPlayersByRoom(roomId);
    const playerArray = players.map(p => ({
        id: p.id,
        name: p.name
    }));

    // Get room details
    const room = await gameStateManager.getRoom(roomId);

    if (!room) {
        console.error("Room not found:", roomId);
        return;
    }

    // Notify all players in the room that a player has joined
    io.to(roomId).emit(SocketChannels.PLAYER_JOINED, { playerArray });

    // Send existing room chat history to the newly connected socket
    const chatHistory = await gameStateManager.getChatMessages(roomId);
    socket.emit(SocketChannels.CHAT_HISTORY, chatHistory);

    // Setup socket listeners for this player
    socketListeners(socket, roomId, playerIdStr, room.roundTime);
});

export default io;