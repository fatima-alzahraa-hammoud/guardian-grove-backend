import { Response, NextFunction } from "express";
import { CustomRequest } from "../interfaces/customRequest";
import { throwError } from "../utils/error";

export const parentsMiddleware = async (req: CustomRequest, res: Response, next: NextFunction):Promise<void> => {
    if (req.user?.role === "parent") {
      next();
    } else {
      throwError({message: "Unauthorized", res, status:401});
      return;
    }
  };
  