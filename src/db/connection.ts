import {connect} from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const db_url: string = process.env.MONGO_URI || "";

const connectToDatabase = async() :Promise<void> => {
    try{

        if (!db_url) {
            throw new Error("Database URL not found in environment variables");
        }

        await connect(db_url);
        console.log("Connected to database");
    } catch(error){
        console.log(error);
    }
};

export default connectToDatabase;