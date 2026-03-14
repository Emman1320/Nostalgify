import { Router } from "express";
import authenticationController from "../controllers/authentication.controller";
class AuthenticationRoute {
    router = Router();
    constructor() {
        this.route();
    }

    route() {
        this.router.get('/user', authenticationController.getUser);
    }
}

export default AuthenticationRoute;