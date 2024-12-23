import express, {Express} from "express";
import dotenv from "dotenv";
import connectToDatabase from "./db/connection";
import userRoutes from "./routes/users.routes";

dotenv.config();

const app: Express= express();
const port: number = parseInt(process.env.PORT || "8080");

app.use(express.json());

app.use("/users", userRoutes);

app.listen(port, () =>{
    console.log("server is running on port 8080");

    connectToDatabase();
});