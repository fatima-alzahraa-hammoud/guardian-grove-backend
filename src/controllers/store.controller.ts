import { Request, Response } from "express";
import { StoreItem } from "../models/storeItem.model";
import { throwError } from "../utils/error";
import { IStore } from "../interfaces/IStore";

//API to get store items based on category
export const getStoreItems = async (req: Request, res: Response) => {
    try {
        const { category } = req.query;

        let query = {};
        if (category && category !== "All") {
            query = { type: category };
        }

        const items = await StoreItem.find(query);

        if (items.length === 0) {
            return throwError({message: "No items found for this category", res, status: 400});
        }

        res.status(200).json({message: "get items successfully",  items });
    } catch (error) {
        return throwError({message: "Error fetching store items", res, status: 400});
    }
};


//API to add Items to store
export const createItem = async (req: Request, res: Response) => {
    try {

        const data = req.body;

        const { name, description, type, price, image } = data;
        if (!name || !description || !type || !price || !image) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }

        const newItem = new StoreItem({
            name,
            description,
            price: price || 5,
            type,
            image,
        });

        await newItem.save();

        res.status(201).json({message: "StoreItem created successfully", StoreItem: newItem});
    } catch (error) {
        return throwError({ message: "An unknown error occurred.", res, status: 500 });
    }
};
