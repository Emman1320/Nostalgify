export interface Room {
    id: string;
    game: string;
    maxPlayers: number;
    roundTime: number;
    createdAt: string;
    isActive: boolean;
}

export interface Player {
    id: string;
    roomId: string;
    name: string;
    joinedAt: string;
}

export interface GameState {
    roomId: string;
    turn: number;
    turnTime: string;
    selectedNumbers: number[];
    playerIds: string[];
    isGameStarted: boolean;
}

export interface TurnInfo {
    id: string;
    time: string;
    selectedNumber?: number;
    isFallbackTurn?: boolean;
    roundTime?: number;
}

export interface RoomDetails {
    maxPlayers: string;
    game: string;
    roundTime: string;
}
