import { Router } from "express";
import AuthenticationRoute from "./authentication.route";
import RoomRoute from "./room.route";

class Route {
    router = Router();

    constructor() {
        this.route();
    }

    route() {
        this.router.use('/auth', new AuthenticationRoute().router);
        this.router.use('/room', new RoomRoute().router);
    }
}

export default Route;