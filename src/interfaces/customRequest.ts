// src/types/CustomRequest.ts
import { Request } from "express";
import { IUser } from "../interfaces/IUser";

export interface CustomRequest extends Request {
  user?: IUser;
}
