import { Response, NextFunction } from "express";
import { CustomRequest } from "../interfaces/customRequest";

export const parentsMiddleware = async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === "father" || req.user?.role === "mother") {
      next();
    } else {
      return res.status(401).send({
        message: "Unauthorized",
      });
    }
  };
  