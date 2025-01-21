import { Response, NextFunction } from "express";
import { CustomRequest } from "../interfaces/customRequest";
import { throwError } from "../utils/error";

export const adminMiddleware = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    if (req.user?.role === "admin") {
      next();
    } else {
      throwError({message: "Unauthorized", res, status:401});
    }
  };
  