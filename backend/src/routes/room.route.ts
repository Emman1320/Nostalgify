import { Router } from "express";
import roomController from "../controllers/room.controller";
import roomValidation from "../validation/room.validation";
import { validate } from "../middlewares/validation.middleware";
class RoomRoute {
    router = Router();
    constructor() {
        this.route();
    }

    route() {
        this.router.post('/create', validate(roomValidation.createRoomSchema), roomController.createRoom);

        this.router.post('/join', validate(roomValidation.joinRoomSchema), roomController.joinRoom);

        this.router.get('/players', roomController.getPlayerRoomDetails)

        this.router.get('/exit', roomController.exitRoom);
    }
}

export default RoomRoute;