import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./index";
import enumConstants from "../constants/enum";
import { addExtraReducers } from "./thunks";

// Define a type for the slice state
export interface PlayerState {
    name: string;
    id: string;
    roomId: string;
    roomPlayers: Array<{
        id: string;
        name: string;
    }>;
    game: string;
    turnInfo: {
        id: string;
        time: string;
        selectedNumber?: number;
        isFallbackTurn?: boolean;
        roundTime?: number;
    }
}

const initialState: PlayerState = {
    id: "",
    name: "",
    roomId: "",
    roomPlayers: [],
    game: "",
    turnInfo: { id: "", time: "" }
}

export const playerSlice = createSlice({
    name: "player",
    initialState,
    reducers: {
        setPlayerName: (state, action) => {
            state.name = action.payload;
        },
        setPlayer: (state, action: PayloadAction<{
            id: string;
            name: string;
            roomId: string | null;
        }>) => {
            state.id = action.payload.id;
            state.name = action.payload.name;
            if (action.payload.roomId?.trim()) {
                state.roomId = action.payload.roomId;
            }
        },
        createRoom: (state, action: PayloadAction<{
            roomId: string;
            game: string;
        }>) => {
            state.roomId = action.payload.roomId;
            localStorage.setItem(enumConstants.LocalStorageKeys.ROOM_ID, action.payload.roomId);
            state.game = action.payload.game;
        },
        setRoomPlayers: (state, action) => {
            state.roomPlayers = action.payload;
        },
        updatePlayerTurn: (state, action: PayloadAction<{ id: string, time: string, selectedNumber?: number, isFallbackTurn?: boolean, roundTime?: number }>) => {
            state.turnInfo = action.payload
        },
        clearRoom: (state) => {
            state.roomId = "";
            state.game = "";
            state.roomPlayers = [];
            state.turnInfo = { id: "", time: "" };
            localStorage.removeItem(enumConstants.LocalStorageKeys.ROOM_ID);
        },
    },
    extraReducers: addExtraReducers,
});


export const { setPlayerName, setPlayer, createRoom, setRoomPlayers, updatePlayerTurn, clearRoom } = playerSlice.actions;

const selectPlayerState = (state: RootState) => state.player;

export const selectPlayerDetails = createSelector(
    [selectPlayerState],
    (player) => ({ id: player.id, name: player.name, roomId: player.roomId })
);
export const selectPlayerName = (state: RootState) => state.player.name;


export default playerSlice.reducer;