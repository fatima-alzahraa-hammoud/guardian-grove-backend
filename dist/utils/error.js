"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = void 0;
const throwError = ({ message = "Internal Server Error", res, status = 500 }) => {
    res.status(status).json({ error: message });
};
exports.throwError = throwError;
