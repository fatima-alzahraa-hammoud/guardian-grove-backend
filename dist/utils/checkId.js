"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkId = void 0;
const error_1 = require("./error");
const mongoose_1 = __importDefault(require("mongoose"));
const checkId = ({ id: id, res }) => {
    if (!id) {
        (0, error_1.throwError)({ message: "Id is required", res, status: 400 });
        return false;
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        (0, error_1.throwError)({ message: "Invalid user ID format", res, status: 400 });
        return false;
    }
    return true;
};
exports.checkId = checkId;
