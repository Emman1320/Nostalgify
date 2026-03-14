import * as React from "react";
import ConfettiEmoji from "../../common/emojis/ConfettiEmoji";
import CoolEmoji from "../../common/emojis/CoolEmoji";
import CryingEmoji from "../../common/emojis/CryingEmoji";
import CursingEmoji from "../../common/emojis/CursingEmoji";
import FaceInClouds from "../../common/emojis/FaceInClouds";
import GrinningEmoji from "../../common/emojis/GrinningEmoji";
import HeartBreak from "../../common/emojis/HeartBreak";
import KissEmoji from "../../common/emojis/KissEmoji";
import LaughingEmoji from "../../common/emojis/LaughingEmoji";
import RollingEyes from "../../common/emojis/RollingEyes";
import SadEmoji from "../../common/emojis/SadEmoji";
import SadEmoji2 from "../../common/emojis/SadEmoji2";
import SadEmoji3 from "../../common/emojis/SadEmoji3";
import WinkEmoji from "../../common/emojis/WinkEmoji";
import ZannyFace from "../../common/emojis/ZannyFace";

export type ChatEmojiDefinition = {
    id: string;
    label: string;
    symbol: string;
    Component: React.ComponentType<any>;
    componentProps?: Record<string, unknown>;
};

export const CHAT_EMOJI_TOKEN_PREFIX = "[[bingo_emoji::";

export const CHAT_EMOJIS: ChatEmojiDefinition[] = [
    { id: "confetti", label: "Confetti", symbol: "🎉", Component: ConfettiEmoji },
    { id: "cool", label: "Cool", symbol: "😎", Component: CoolEmoji },
    { id: "crying", label: "Crying", symbol: "😭", Component: CryingEmoji },
    { id: "cursing", label: "Cursing", symbol: "🤬", Component: CursingEmoji },
    { id: "clouds", label: "Clouds", symbol: "😶‍🌫️", Component: FaceInClouds },
    { id: "grinning", label: "Grinning", symbol: "😀", Component: GrinningEmoji },
    { id: "heartbreak", label: "Heartbreak", symbol: "💔", Component: HeartBreak },
    { id: "kiss", label: "Kiss", symbol: "😘", Component: KissEmoji },
    { id: "laughing", label: "Laughing", symbol: "😂", Component: LaughingEmoji },
    { id: "rollingeyes", label: "Rolling Eyes", symbol: "🙄", Component: RollingEyes },
    { id: "sad", label: "Sad", symbol: "😞", Component: SadEmoji },
    { id: "sad2", label: "Sad 2", symbol: "😔", Component: SadEmoji2 },
    { id: "sad3", label: "Sad 3", symbol: "😿", Component: SadEmoji3 },
    { id: "wink", label: "Wink", symbol: "😉", Component: WinkEmoji },
    { id: "zanny", label: "Zanny", symbol: "🤪", Component: ZannyFace }
];

export const CHAT_EMOJI_MAP = CHAT_EMOJIS.reduce<Record<string, ChatEmojiDefinition>>((acc, emoji) => {
    acc[emoji.id] = emoji;
    return acc;
}, {});

export const CHAT_EMOJI_SYMBOL_MAP = CHAT_EMOJIS.reduce<Record<string, ChatEmojiDefinition>>((acc, emoji) => {
    acc[emoji.symbol] = emoji;
    return acc;
}, {});

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const CHAT_EMOJI_SYMBOL_REGEX = new RegExp(
    CHAT_EMOJIS.map((emoji) => escapeRegExp(emoji.symbol)).sort((a, b) => b.length - a.length).join("|"),
    "g"
);

export const CHAT_EMOJI_TOKEN_REGEX = /\[\[bingo_emoji::([a-z0-9]+)\]\]/g;