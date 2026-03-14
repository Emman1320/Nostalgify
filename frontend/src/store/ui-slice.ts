import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import enumConstants from "../constants/enum";
import { RootState } from ".";

export interface UIState {
    modalType: enumConstants.ModalTypes;
    gameStatus: enumConstants.GameStatus;
    chatMessages: ChatMessage[];

    snackbar: {
        open: boolean;
        message: string;
        type: SnackbarType;
    }
}
const initialState: UIState = {
    modalType: enumConstants.ModalTypes.NONE,
    gameStatus: enumConstants.GameStatus.NONE,
    chatMessages: [],
    snackbar: {
        open: false,
        message: "",
        type: "info"
    }
}

export const uiSlice = createSlice({
    name: "ui",
    initialState: initialState,
    reducers: {
        triggerModal(state, action: PayloadAction<enumConstants.ModalTypes>) {
            state.modalType = action.payload;
        },
        closeModal(state) {
            state.modalType = enumConstants.ModalTypes.NONE;
        },
        changeGameStatus(state, action: PayloadAction<enumConstants.GameStatus>) {
            state.gameStatus = action.payload;
            if (action.payload === enumConstants.GameStatus.NONE) {
                state.chatMessages = [];
            }
        },
        setChatMessages: (state, action: PayloadAction<ChatMessage[]>) => {
            state.chatMessages = action.payload;
        },
        appendChatMessage: (state, action: PayloadAction<ChatMessage>) => {
            state.chatMessages.push(action.payload);
        },
        showSnackbar: (state, action: PayloadAction<{ message: string; type: SnackbarType }>) => {
            state.snackbar.open = true;
            state.snackbar.message = action.payload.message;
            state.snackbar.type = action.payload.type;
        },
        hideSnackbar: (state) => {
            state.snackbar.open = false;
            state.snackbar.message = "";
        },
    }
});

export const { triggerModal, closeModal, changeGameStatus, showSnackbar, hideSnackbar, setChatMessages, appendChatMessage } = uiSlice.actions;

export const selectModalType = (state: RootState) => state.ui.modalType;
export const selectGameStatus = (state: RootState) => state.ui.gameStatus;
export const selectChatMessages = (state: RootState) => state.ui.chatMessages;

export default uiSlice.reducer;