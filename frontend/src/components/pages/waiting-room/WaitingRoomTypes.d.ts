type WaitingRoomStyles = Record<
    "waiting-room-game-preview"
    | "game-preview-header"
    | "game-preview-description"
    | "game-action"
    | "player-list"
    | "player-card"
    | "player-list-header"
    | "roomId-response"
    | "roomId-header"
    | "roomId"
    | "content-copy"
    | "highlight-player"
    | "player-card-container"
    | "countdown-overlay"
    | "countdown-number"
    | "vote-section"
    | "vote-count"
    , string
>;

declare module "*/WaitingRoom.module.css" {
    const content: WaitingRoomStyles;
    export default content;
}