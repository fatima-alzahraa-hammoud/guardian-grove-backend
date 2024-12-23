import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.listen(port, () =>{
    console.log("server is running on port 8080");
});