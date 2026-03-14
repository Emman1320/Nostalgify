import { io, Socket } from "socket.io-client";

class SocketManager {
  static socket: Socket;
  static playerId: string;

  static connect(id: string) {
    this.socket = io(`${process.env.REACT_APP_WEB_SOCKET_URL}`, {
      query: { playerId: id },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.playerId = id;

    this.socket.on("connect", () => {
      console.log("Connected to websocket");
    });

    this.socket.on('ping', (arg) => {
      console.log('ping', arg);
    });

    return this.socket;
  }

  static disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  static isConnected(): boolean {
    return this.socket && this.socket.connected;
  }


}

export default SocketManager;