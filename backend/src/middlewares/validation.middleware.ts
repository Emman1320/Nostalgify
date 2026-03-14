import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import Joi from "joi";

export const validate = (schema: Joi.AnySchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.validateAsync(req?.body);
        } catch (error: any) {
            console.log(error);
            return res.status(httpStatus.BAD_REQUEST).send({ message: error.message });
        }

        next();
    }
}
