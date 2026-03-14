declare module "*.svg" {
    const content: string;
    export default content;
}

declare module "*.avif" {
    const content: string;
    export default content;
}

declare module "*.png" {
    const content: string;
    export default content;
}

type SnackbarType = "success" | "error" | "warning" | "info";

// Player types
interface PlayerInfo {
    id: string;
    name: string;
}

interface TurnInfo {
    id: string;
    time: string;
    selectedNumber?: number;
    isFallbackTurn?: boolean;
    roundTime?: number;
}

// Socket event types
interface PlayerJoinedEvent {
    playerArray: PlayerInfo[];
}

interface TurnEvent extends TurnInfo { }

interface StartGameEvent extends TurnInfo { }

interface GameOverEvent {
    winnerId: string;
    winnerName: string;
}

interface ChatMessageEvent {
    playerId: string;
    playerName: string;
    message: string;
    timestamp: string;
}

interface StrikeUpdateEvent {
    playerId: string;
    strikes: number;
}

// Chat types
interface ChatMessage {
    playerId: string;
    playerName: string;
    message: string;
    timestamp: string;
    isOwn: boolean;
}
