type ChatPanelStyles = Record<
    | "chat-shell"
    | "chat-shell-collapsed"
    | "chat-shell-expanded"
    | "chat-shell-header"
    | "chat-shell-history"
    | "chat-shell-input"
    | "chat-emoji-picker"
    | "chat-emoji-item"
    | "chat-emoji-preview"
    | "chat-inline-emoji"
    | "chat-inline-emoji-asset"
    | "chat-popup-item"
    | "chat-popup-item-own"
    | "chat-popup-item-sticker"
    | "chat-popup-name"
    | "chat-popup-message"
    | "chat-popup-message-sticker"
    | "chat-sticker-emoji"
    | "chat-sticker-emoji-asset"
    | "chat-empty-text"
    | "chat-input-container"
    | "chat-input"
    , string
>;

declare module "*/ChatPanel.module.css" {
    const content: ChatPanelStyles;
    export default content;
}
