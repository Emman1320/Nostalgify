import { Request, Response } from "express";

const getUser = (req: Request, res: Response) => {
    return res.send("hello");
}


export default {
    getUser
}