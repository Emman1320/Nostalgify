import { ErrorRequestHandler } from "express"
import httpStatus from "http-status"

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error(err.stack);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "Internal server error" });
}

export default {
    errorHandler
};