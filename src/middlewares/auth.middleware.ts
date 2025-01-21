import { Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../models/user.model";
import { throwError } from "../utils/error";
import { CustomRequest } from "../interfaces/customRequest";

dotenv.config();

const JWT_SECRET_KEY = process.env.JWT_SECRET;
export const authMiddleware = async (req: CustomRequest, res: Response, next: NextFunction):Promise<void> => {
    const authHeader = req.headers.authorization;

    if(!authHeader) {
        throwError({message: "Unauthorized", res, status: 401});
        return;
    }

    const splitted = authHeader?.split(" ");

    if (splitted?.length !== 2 || splitted[0] !== "Bearer"){
        throwError({message: "Unauthorized", res, status: 401});
        return;
    }

    const token = splitted[1];

    if (!JWT_SECRET_KEY) {
        throwError({ message: "JWT_SECRET_KEY is not defined", res, status: 500 });
        return;
    }

    try{
        const payload = await jwt.verify(token, JWT_SECRET_KEY) as JwtPayload;

        const id = payload.userId;
        const user = await User.findById(id);

        if (!user) {
            throwError({ message: "User not found", res, status: 404 });
            return;
        }

        req.user = user;
        next();
    } catch(error) {
        throwError({message: "Unauthorized", res, status: 401});
    }
}