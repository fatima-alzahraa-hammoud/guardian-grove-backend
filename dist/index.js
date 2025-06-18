"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openai = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cloudinary_1 = require("cloudinary");
const connection_1 = __importDefault(require("./db/connection"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const adventure_routes_1 = __importDefault(require("./routes/adventure.routes"));
const achievement_routes_1 = __importDefault(require("./routes/achievement.routes"));
const store_routes_1 = __importDefault(require("./routes/store.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const note_routes_1 = __importDefault(require("./routes/note.routes"));
const goal_routes_1 = __importDefault(require("./routes/goal.routes"));
const family_routes_1 = __importDefault(require("./routes/family.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const book_routes_1 = __importDefault(require("./routes/book.routes"));
const drawing_routes_1 = __importDefault(require("./routes/drawing.routes"));
const coloring_routes_1 = __importDefault(require("./routes/coloring.routes"));
const story_routes_1 = __importDefault(require("./routes/story.routes"));
const cors_1 = __importDefault(require("cors"));
const openai_1 = require("openai");
dotenv_1.default.config();
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const app = (0, express_1.default)();
// OpenAI API Configuration
exports.openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
// Use CORS middleware
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
const port = parseInt(process.env.PORT || "8000");
app.use(express_1.default.json());
app.use("/auth", auth_routes_1.default);
app.use("/users", users_routes_1.default);
app.use("/adventures", adventure_routes_1.default);
app.use("/achievements", achievement_routes_1.default);
app.use("/store", store_routes_1.default);
app.use("/userNotifications", notification_routes_1.default);
app.use("/userNotes", note_routes_1.default);
app.use("/userGoals", goal_routes_1.default);
app.use("/family", family_routes_1.default);
app.use("/chats", chat_routes_1.default);
app.use("/books", book_routes_1.default);
app.use("/drawings", drawing_routes_1.default);
app.use("/colorings", coloring_routes_1.default);
app.use("/stories", story_routes_1.default);
app.listen(port, () => {
    console.log("server is running on port 8000");
    (0, connection_1.default)();
});
