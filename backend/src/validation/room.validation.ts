import Joi from "joi";
import { Games } from "../constants/enum";
import { MAX_PLAYER_COUNT, ROUND_TIMINGS } from "../constants/constant";

const createRoomSchema = Joi.object({
    game: Joi.string().valid(Games.BINGO).required(),
    maxPlayers: Joi.number().valid(...MAX_PLAYER_COUNT),
    roundTime: Joi.number().valid(...ROUND_TIMINGS),
    playerInfo: Joi.object({
        id: Joi.string().required(),
        name: Joi.string().required()
    }).required()
})

const joinRoomSchema = Joi.object({
    roomId: Joi.string().required(),
    playerInfo: Joi.object({
        id: Joi.string().required(),
        name: Joi.string().required()
    }).required()
})

export default {
    createRoomSchema,
    joinRoomSchema
};