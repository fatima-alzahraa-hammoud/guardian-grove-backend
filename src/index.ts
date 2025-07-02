import express, {Express} from "express";
import dotenv from "dotenv";
import { v2 as cloudinary } from 'cloudinary';
import connectToDatabase from "./db/connection";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/users.routes";
import adventureRoutes from "./routes/adventure.routes";
import achievementRoutes from "./routes/achievement.routes";
import storeRoutes from "./routes/store.routes";
import notificationRoutes from "./routes/notification.routes";
import noteRoutes from "./routes/note.routes";
import goalRoutes from "./routes/goal.routes";
import familyRoutes from "./routes/family.routes";
import chatRoutes from "./routes/chat.routes";
import bookRoutes from "./routes/book.routes";
import drawingRoutes from "./routes/drawing.routes";
import coloringRoutes from "./routes/coloring.routes";
import storyRoutes from "./routes/story.routes";
import journalRoutes from "./routes/journal.routes";
import bondingActivitiesRoutes from "./routes/bondingActivity.routes";
import familyChatsRoutes from "./routes/familyMessage.routes";
import eventsRoutes from "./routes/bondingEvents.routes";
import cors from "cors";
import { OpenAI } from "openai";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app: Express= express();

// OpenAI API Configuration
export const openai = new OpenAI({
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    apiKey: process.env.DeepSeek_API_KEY,
});

// Use CORS middleware
app.use(cors({
    origin: ["https://guardian-grove.netlify.app", "http://localhost:5173", 'http://localhost:3000', 'https://guardian-grove-mobile.netlify.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const port: number = parseInt(process.env.PORT || "8000");

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/adventures", adventureRoutes);
app.use("/achievements", achievementRoutes);
app.use("/store", storeRoutes);
app.use("/userNotifications", notificationRoutes);
app.use("/userNotes", noteRoutes);
app.use("/userGoals", goalRoutes);
app.use("/family", familyRoutes);
app.use("/chats", chatRoutes);
app.use("/books", bookRoutes);
app.use("/drawings", drawingRoutes);
app.use("/colorings", coloringRoutes);
app.use("/stories", storyRoutes);
app.use("/journal", journalRoutes);
app.use("/bondingActivities", bondingActivitiesRoutes);
app.use("/familyChats", familyChatsRoutes);
app.use("/events", eventsRoutes);

app.get("/", (req, res) => {
    res.send("Guardian Grove Backend is running ✅");
});

app.listen(port, () =>{
    console.log(`server is running on port ${port}`);

    connectToDatabase();
});