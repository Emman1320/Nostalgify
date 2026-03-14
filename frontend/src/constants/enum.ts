namespace enumConstants {
    export enum ModalTypes {
        CREATE_ROOM = "create_room",
        JOIN_ROOM = "join_room",
        NONE = "none"
    }

    export enum GameTypes {
        BINGO = "bingo",
    }

    export enum LocalStorageKeys {
        ROOM_ID = "roomId",
        PLAYER_ID = "playerId",
        PLAYER_NAME = "playerName"
    }

    export enum GameStatus {
        WAITING = "waiting",
        STARTED = "started",
        NEXT_ROUND = "next_round",
        GAME_OVER = "game_over",
        WINNER = "winner",
        NONE = "none"
    }

    export enum SocketChannels {
        START_GAME = "start-game",
        PLAYER_JOINED = "player-joined",
        TURN = "turn",
        GAME_OVER = "game-over",
        WINNER = "winner",
        STRIKE_UPDATE = "strike-update",
        CHAT_MESSAGE = "chat-message",
        CHAT_HISTORY = "chat-history",
        REPLAY_ROUND = "replay-round",
        LAST_PLAYER_STANDING = "last-player-standing"
    }

    export enum OrientationTypes {
        VERTICAL = "vertical",
        HORIZONTAL = "horizontal",
        FORWARD_DIAGONAL = "forward_diagonal",
        BACKWARD_DIAGONAL = "backward_diagonal",
    }

    export enum DirectionTypes {
        UP = "up",
        RIGHT = "right",
        DOWN = "down",
        LEFT = "left",
        UP_RIGHT = "up_right",
        UP_LEFT = "up_left",
        DOWN_RIGHT = "down_right",
        DOWN_LEFT = "down_left"
    }
}

export default enumConstants;