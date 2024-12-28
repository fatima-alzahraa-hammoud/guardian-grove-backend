import express, {Express} from "express";
import dotenv from "dotenv";
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

dotenv.config();

const app: Express= express();
const port: number = parseInt(process.env.PORT || "8080");

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
app.use("/chat", chatRoutes);

app.listen(port, () =>{
    console.log("server is running on port 8080");

    connectToDatabase();
});