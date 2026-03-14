import React from "react";
import { IconButton } from "@mui/material";
import { Send, ExpandLess, ExpandMore, EmojiEmotionsOutlined } from "@mui/icons-material";
import { useAppSelector } from "../../../store/hook";
import enumConstants from "../../../constants/enum";
import SocketManager from "../../../utils/socket-manager";
import {
    CHAT_EMOJIS,
    CHAT_EMOJI_MAP,
    CHAT_EMOJI_SYMBOL_MAP,
    CHAT_EMOJI_SYMBOL_REGEX,
    CHAT_EMOJI_TOKEN_PREFIX,
    CHAT_EMOJI_TOKEN_REGEX,
} from "../../pages/game-room/chat.utils";
import classes from "./ChatPanel.module.css";

interface ChatPanelProps {
    expanded?: boolean;
    onExpandToggle?: () => void;
    showExpandToggle?: boolean;
    className?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
    expanded = false,
    onExpandToggle,
    showExpandToggle = true,
    className = "",
}) => {
    const chatMessages = useAppSelector((state) => state.ui.chatMessages);
    const playerDetails = useAppSelector((state) => state.player);
    const chatHistoryRef = React.useRef<HTMLDivElement>(null);
    const [chatInput, setChatInput] = React.useState("");
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = React.useState(false);

    React.useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [chatMessages, expanded]);

    const handleSendMessage = () => {
        if (chatInput.trim() && playerDetails.id) {
            const normalizedMessage = CHAT_EMOJIS.reduce((acc, emoji) => {
                return acc.split(emoji.symbol).join(`${CHAT_EMOJI_TOKEN_PREFIX}${emoji.id}]]`);
            }, chatInput.trim());

            const message: ChatMessageEvent = {
                playerId: playerDetails.id,
                playerName: playerDetails.name,
                message: normalizedMessage,
                timestamp: new Date().toISOString(),
            };
            SocketManager.socket.emit(enumConstants.SocketChannels.CHAT_MESSAGE, message);
            setChatInput("");
            setIsEmojiPickerOpen(false);
        }
    };

    const appendEmojiToInput = (emojiSymbol: string) => {
        setChatInput((prev) => {
            const needsSpace = prev.length > 0 && !prev.endsWith(" ");
            return `${prev}${needsSpace ? " " : ""}${emojiSymbol} `;
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSendMessage();
    };

    const renderTextWithSymbols = (text: string, prefix: string): React.ReactNode[] => {
        const parts: React.ReactNode[] = [];
        CHAT_EMOJI_SYMBOL_REGEX.lastIndex = 0;
        let cursor = 0;
        let symbolIndex = 0;
        let symbolMatch = CHAT_EMOJI_SYMBOL_REGEX.exec(text);

        while (symbolMatch) {
            const symbol = symbolMatch[0];
            if (symbolMatch.index > cursor) {
                parts.push(<span key={`${prefix}-text-${cursor}`}>{text.slice(cursor, symbolMatch.index)}</span>);
            }
            const emojiInfo = CHAT_EMOJI_SYMBOL_MAP[symbol];
            if (emojiInfo) {
                const EmojiComponent = emojiInfo.Component;
                const emojiComponentProps = emojiInfo.componentProps ?? {};
                parts.push(
                    <span key={`${prefix}-symbol-${symbolIndex}`} className={classes["chat-inline-emoji"]} title={emojiInfo.label}>
                        <span className={classes["chat-inline-emoji-asset"]}>
                            <EmojiComponent {...emojiComponentProps} />
                        </span>
                    </span>
                );
            } else {
                parts.push(<span key={`${prefix}-unknown-${symbolIndex}`}>{symbol}</span>);
            }
            cursor = symbolMatch.index + symbol.length;
            symbolIndex += 1;
            symbolMatch = CHAT_EMOJI_SYMBOL_REGEX.exec(text);
        }
        if (cursor < text.length) {
            parts.push(<span key={`${prefix}-tail-${cursor}`}>{text.slice(cursor)}</span>);
        }
        return parts;
    };

    const isStickerOnlyMessage = (message: string): boolean => {
        CHAT_EMOJI_TOKEN_REGEX.lastIndex = 0;
        const hasToken = CHAT_EMOJI_TOKEN_REGEX.test(message);
        CHAT_EMOJI_SYMBOL_REGEX.lastIndex = 0;
        const hasSymbol = CHAT_EMOJI_SYMBOL_REGEX.test(message);
        const withoutTokens = message.replace(CHAT_EMOJI_TOKEN_REGEX, " ");
        CHAT_EMOJI_SYMBOL_REGEX.lastIndex = 0;
        const withoutSymbols = withoutTokens.replace(CHAT_EMOJI_SYMBOL_REGEX, " ");
        return (hasToken || hasSymbol) && withoutSymbols.trim().length === 0;
    };

    const renderChatMessage = (message: string, stickerOnly: boolean): React.ReactNode[] => {
        const parts: React.ReactNode[] = [];
        let cursor = 0;
        let tokenIndex = 0;
        CHAT_EMOJI_TOKEN_REGEX.lastIndex = 0;
        let match = CHAT_EMOJI_TOKEN_REGEX.exec(message);

        while (match) {
            const [fullToken, emojiId] = match;
            if (match.index > cursor) {
                parts.push(...renderTextWithSymbols(message.slice(cursor, match.index), `part-${cursor}`));
            }
            const emojiInfo = CHAT_EMOJI_MAP[emojiId];
            if (emojiInfo) {
                const EmojiComponent = emojiInfo.Component;
                const emojiComponentProps = emojiInfo.componentProps ?? {};
                parts.push(
                    <span
                        key={`emoji-${tokenIndex}`}
                        className={stickerOnly ? classes["chat-sticker-emoji"] : classes["chat-inline-emoji"]}
                        title={emojiInfo.label}
                    >
                        <span className={stickerOnly ? classes["chat-sticker-emoji-asset"] : classes["chat-inline-emoji-asset"]}>
                            <EmojiComponent {...emojiComponentProps} />
                        </span>
                    </span>
                );
            } else {
                parts.push(<span key={`unknown-${tokenIndex}`}></span>);
            }
            cursor = match.index + fullToken.length;
            tokenIndex += 1;
            match = CHAT_EMOJI_TOKEN_REGEX.exec(message);
        }
        if (cursor < message.length) {
            parts.push(...renderTextWithSymbols(message.slice(cursor), `tail-${cursor}`));
        }
        if (parts.length === 0) {
            parts.push(...renderTextWithSymbols(message, "full-message"));
        }
        return parts;
    };

    return (
        <div
            className={[
                classes["chat-shell"],
                expanded ? classes["chat-shell-expanded"] : classes["chat-shell-collapsed"],
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div className={classes["chat-shell-header"]}>
                <span>Room Chat</span>
                {showExpandToggle && onExpandToggle && (
                    <IconButton size="medium" onClick={onExpandToggle} sx={{ color: "white" }}>
                        {expanded ? <ExpandLess fontSize="medium" /> : <ExpandMore fontSize="medium" />}
                    </IconButton>
                )}
            </div>
            <div ref={chatHistoryRef} className={classes["chat-shell-history"]}>
                {chatMessages.length === 0 && (
                    <div className={classes["chat-empty-text"]}>No messages yet</div>
                )}
                {chatMessages.map((msg, index) => {
                    const stickerOnly = isStickerOnlyMessage(msg.message);
                    return (
                        <div
                            key={`${msg.timestamp}-${index}`}
                            className={[
                                classes["chat-popup-item"],
                                msg.isOwn ? classes["chat-popup-item-own"] : "",
                                stickerOnly ? classes["chat-popup-item-sticker"] : "",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                        >
                            <div className={classes["chat-popup-name"]}>{msg.playerName}</div>
                            <div
                                className={`${classes["chat-popup-message"]} ${stickerOnly ? classes["chat-popup-message-sticker"] : ""
                                    }`}
                            >
                                {renderChatMessage(msg.message, stickerOnly)}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className={classes["chat-shell-input"]}>
                {isEmojiPickerOpen && (
                    <div className={classes["chat-emoji-picker"]}>
                        {CHAT_EMOJIS.map((emoji) => {
                            const EmojiComponent = emoji.Component;
                            const emojiComponentProps = emoji.componentProps ?? {};
                            return (
                                <button
                                    key={emoji.id}
                                    type="button"
                                    className={classes["chat-emoji-item"]}
                                    onClick={() => appendEmojiToInput(emoji.symbol)}
                                >
                                    <span className={classes["chat-emoji-preview"]}>
                                        <EmojiComponent {...emojiComponentProps} />
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
                <div className={classes["chat-input-container"]}>
                    <IconButton size="medium" onClick={() => setIsEmojiPickerOpen((prev) => !prev)}>
                        <EmojiEmotionsOutlined fontSize="medium" sx={{ color: "#f6f8ff" }} />
                    </IconButton>
                    <input
                        className={classes["chat-input"]}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                    />
                    <IconButton size="medium" onClick={handleSendMessage}>
                        <Send fontSize="medium" />
                    </IconButton>
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;
