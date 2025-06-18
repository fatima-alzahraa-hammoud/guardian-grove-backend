"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_model_1 = require("../models/user.model");
const error_1 = require("../utils/error");
dotenv_1.default.config();
const JWT_SECRET_KEY = process.env.JWT_SECRET;
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        return;
    }
    const splitted = authHeader === null || authHeader === void 0 ? void 0 : authHeader.split(" ");
    if ((splitted === null || splitted === void 0 ? void 0 : splitted.length) !== 2 || splitted[0] !== "Bearer") {
        (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        return;
    }
    const token = splitted[1];
    if (!JWT_SECRET_KEY) {
        (0, error_1.throwError)({ message: "JWT_SECRET_KEY is not defined", res, status: 500 });
        return;
    }
    try {
        const payload = yield jsonwebtoken_1.default.verify(token, JWT_SECRET_KEY);
        const id = payload.userId;
        const user = yield user_model_1.User.findById(id);
        if (!user) {
            (0, error_1.throwError)({ message: "User not found", res, status: 404 });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
    }
});
exports.authMiddleware = authMiddleware;
