"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const store_controller_1 = require("../controllers/store.controller");
const adminMiddleware_1 = require("../middlewares/adminMiddleware");
const router = express_1.default.Router();
router.get("/", auth_middleware_1.authMiddleware, store_controller_1.getStoreItems);
router.post("/", auth_middleware_1.authMiddleware, store_controller_1.createItem);
router.delete("/:itemId", auth_middleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, store_controller_1.deleteItem);
router.put("/", auth_middleware_1.authMiddleware, store_controller_1.updateItem);
router.post("/buy", auth_middleware_1.authMiddleware, store_controller_1.buyItem);
exports.default = router;
