import { Response, NextFunction } from "express";
import { CustomRequest } from "../interfaces/customRequest";

export const adminMiddleware = async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === "admin") {
      next();
    } else {
      return res.status(401).send({
        message: "Unauthorized",
      });
    }
  };
  