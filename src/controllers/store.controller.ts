import { Request, Response } from "express";
import { Store } from "../models/store.model";
import { throwError } from "../utils/error";

export const getStoreItems = async (req: Request, res: Response) => {
    try {
        const { category } = req.query;

        let query = {};
        if (category && category !== "All") {
            query = { type: category };
        }

        const items = await Store.find(query);

        if (items.length === 0) {
            return throwError({message: "No items found for this category", res, status: 400});
        }

        res.status(200).json({message: "get items successfully",  items });
    } catch (error) {
        return throwError({message: "Error fetching store items", res, status: 400});
    }
};
 