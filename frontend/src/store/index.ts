import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './player-slice';
import uiReducer from './ui-slice';

export const store = configureStore({
  reducer: {
    player: playerReducer,
    ui: uiReducer
  }
})

// Infer the `RootState`,  `AppDispatch`, and `AppStore` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store