import { ActionReducerMapBuilder, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from ".";
import { apiService } from "../utils/axios";
import { PlayerState } from "./player-slice";
import enumConstants from "../constants/enum";

export const exitRoom = createAsyncThunk<void, void, { state: RootState }>(
    'player/exitRoom',
    async (_payload, thunkAPI) => {
        try {
            const playerDetails = thunkAPI.getState().player;
            const response = await apiService.exitRoom({ playerId: playerDetails.id });
            return response.data;
        } catch (error: any) {
            // Extract error message from API response or fallback to a default one
            const errorMessage = error.response?.data?.message || "Failed to exit room. Please try again.";
            return thunkAPI.rejectWithValue(errorMessage);
        }
    },
)

export const addExtraReducers = (builder: ActionReducerMapBuilder<PlayerState>) => {
    builder.addCase(exitRoom.fulfilled, (state) => {
        state.roomId = "";
        state.game = "";
        state.roomPlayers = [];
        state.turnInfo = { id: "", time: "" };
        localStorage.removeItem(enumConstants.LocalStorageKeys.ROOM_ID);
    })
}
