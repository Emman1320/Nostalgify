const playerNameAllowedCharactersPattern = /^[A-Z|a-z|0-9]$/
const MaxPlayerNameCharacterLength = 10;
const RoundTimings = [20, 30, 45, 60]
const MaxPlayerCountOptions = [2, 3, 4, 5];

const NumberOfStrikesToWinBingo = 5;

export const constants = {
    playerNameAllowedCharactersPattern,
    MaxPlayerNameCharacterLength,
    RoundTimings,
    MaxPlayerCountOptions,
    NumberOfStrikesToWinBingo
} as const;