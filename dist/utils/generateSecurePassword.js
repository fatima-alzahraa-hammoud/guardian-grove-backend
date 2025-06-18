"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSecurePassword = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateSecurePassword = () => {
    return crypto_1.default.randomBytes(9).toString('base64')
        .replace(/[+/=]/g, '')
        .slice(0, 12)
        .replace(/([a-z])/g, (char, index) => index % 2 === 0 ? char.toUpperCase() : char);
};
exports.generateSecurePassword = generateSecurePassword;
