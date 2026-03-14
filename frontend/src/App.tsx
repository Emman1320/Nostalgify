import React, { useEffect, useLayoutEffect } from "react";
import "./App.css";
import Home from "./components/pages/home/Home";
import { useAppDispatch, useAppSelector } from "./store/hook";
import { selectPlayerDetails, setPlayer, setRoomPlayers, updatePlayerTurn } from "./store/player-slice";
import { nanoid } from "nanoid";
import { changeGameStatus, selectGameStatus, setChatMessages, appendChatMessage } from "./store/ui-slice";
import enumConstants from "./constants/enum";
import WaitingRoom from "./components/pages/waiting-room/WaitingRoom";
import SocketManager from "./utils/socket-manager";
import { Socket } from "socket.io-client";
import GameRoom from "./components/pages/game-room/GameRoom";
import ErrorBoundary from "./components/common/error-boundary/ErrorBoundary";

function App() {
  const dispatch = useAppDispatch();
  const gameStatus = useAppSelector(selectGameStatus);
  const playerDetails = useAppSelector(selectPlayerDetails);
  const socketRef = React.useRef<Socket>(null);

  useLayoutEffect(() => {
    let playerName = localStorage.getItem(enumConstants.LocalStorageKeys.PLAYER_NAME);
    let playerId = localStorage.getItem(enumConstants.LocalStorageKeys.PLAYER_ID);
    let roomId = localStorage.getItem(enumConstants.LocalStorageKeys.ROOM_ID);

    if (!playerName?.trim()) {
      const randomSuffix = Math.floor(Math.random() * 10000).toString();
      playerName = `Player${randomSuffix}`;
      localStorage.setItem(enumConstants.LocalStorageKeys.PLAYER_NAME, playerName);
    }

    if (!playerId?.trim()) {
      playerId = nanoid();
      localStorage.setItem(enumConstants.LocalStorageKeys.PLAYER_ID, playerId);
    }

    dispatch(setPlayer({ id: playerId, name: playerName, roomId: roomId }));
  }, [dispatch]);

  useEffect(() => {
    if (playerDetails.roomId && playerDetails.id) {
      const socket = SocketManager.connect(playerDetails.id);

      socket.on(enumConstants.SocketChannels.PLAYER_JOINED, (arg) => {
        dispatch(setRoomPlayers(arg?.playerArray));
      });

      socket.on('disconnect', (reason: string) => {
        console.log('Disconnected from socket:', reason);

        // Only attempt to reconnect if it wasn't a manual disconnect
        if (reason !== 'io client disconnect') {
          console.log('Attempting to reconnect...');
        }
      });

      socket.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error);
      });

      socket.on('reconnect', (attemptNumber: number) => {
        console.log('Reconnected after', attemptNumber, 'attempts');
      });

      socket.on('reconnect_attempt', (attemptNumber: number) => {
        console.log('Attempting reconnection:', attemptNumber);
      });

      socket.on('reconnect_error', (error: Error) => {
        console.error('Reconnection error:', error);
      });

      socket.on('reconnect_failed', () => {
        console.error('Reconnection failed');
      });

      socket.on(enumConstants.SocketChannels.TURN, (arg) => {
        dispatch(updatePlayerTurn(arg));
      });

      socket.on(enumConstants.SocketChannels.CHAT_MESSAGE, (message: ChatMessageEvent) => {
        dispatch(appendChatMessage({ ...message, isOwn: message.playerId === playerDetails.id }));
      });

      socket.on(enumConstants.SocketChannels.CHAT_HISTORY, (messages: ChatMessageEvent[]) => {
        const normalized: ChatMessage[] = messages.map((m) => ({ ...m, isOwn: m.playerId === playerDetails.id }));
        dispatch(setChatMessages(normalized));
      });

      socket.on(enumConstants.SocketChannels.START_GAME, (arg: StartGameEvent) => {
        dispatch(updatePlayerTurn(arg));
        dispatch(changeGameStatus(enumConstants.GameStatus.STARTED));
      });

      socket.on(enumConstants.SocketChannels.WINNER, (arg: GameOverEvent) => {
        // When someone wins
        if (arg.winnerId === playerDetails.id) {
          // You won
          dispatch(changeGameStatus(enumConstants.GameStatus.WINNER));
        } else {
          // Someone else won, you lost
          dispatch(changeGameStatus(enumConstants.GameStatus.GAME_OVER));
        }
      });

      socket.on(enumConstants.SocketChannels.REPLAY_ROUND, () => {
        dispatch(updatePlayerTurn({ id: "", time: "" }));
        dispatch(changeGameStatus(enumConstants.GameStatus.WAITING));
      });

      socket.on(enumConstants.SocketChannels.LAST_PLAYER_STANDING, () => {
        // Do not change game status — keep it as STARTED so GameRoom can
        // detect roomPlayers.length < 2 and show the no-players dialog
      });

      socketRef.current = socket;
    }
    return () => {
      if (socketRef.current) {
        socketRef.current?.close();
      }
    }
  }, [dispatch, playerDetails.roomId, playerDetails.id]);


  return (
    <ErrorBoundary>
      <div>
        <WaitingRoom /> {/*Already mount and exit handled inside */}
        {gameStatus === enumConstants.GameStatus.NONE && <Home />}
        {([
          enumConstants.GameStatus.GAME_OVER,
          enumConstants.GameStatus.WINNER,
          enumConstants.GameStatus.STARTED
        ].includes(gameStatus)) && <GameRoom />}
      </div>
    </ErrorBoundary>
  );
}

export default App;
