import axios, { Method } from "axios";

const api = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL
});

// function createRoute<D = any, P = any>(method: Method, url: string) {
//     return async (payload: { data?: D, params?: P }) => await api({ method, url, ...payload });
// };

function createRoute<P = any>(method: "GET" | "DELETE", url: string): (params?: P) => Promise<any>;

function createRoute<D = any, P = any>(method: Exclude<Method, "GET">, url: string): (data?: D, params?: P) => Promise<any>;

function createRoute<D = any, P = any>(method: Method, url: string) {
    return async (data?: D, params?: P) => {
        let payload: any = {};
        if (method === "GET" || method === "DELETE") payload.params = data;
        else payload = { data, params };

        return await api({ method, url, ...payload });
    }
}

export const apiService = {
    createRoom: createRoute<{
        playerInfo: Record<'id' | 'name', string>;
        maxPlayers: number;
        roundTime: number;
        game: string;
    }>("POST", "/room/create"),

    joinRoom: createRoute<{
        playerInfo: Record<'id' | 'name', string>;
        roomId: string;
    }>("POST", "/room/join"),

    exitRoom: createRoute<{
        playerId: string;
    }>("GET", "/room/exit")
}

export default api;