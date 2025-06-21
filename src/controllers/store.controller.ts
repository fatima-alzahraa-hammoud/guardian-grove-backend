import { Request, Response } from "express";
import { StoreItem } from "../models/storeItem.model";
import { throwError } from "../utils/error";
import { checkId } from "../utils/checkId";
import { User } from "../models/user.model";
import { CustomRequest } from "../interfaces/customRequest";
import { IPurchasedItem } from "../interfaces/IPurschasedItem";

//API to get store items based on category
export const getStoreItems = async (req: Request, res: Response): Promise<void> => {
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
export const createItem = async (req: Request, res: Response): Promise<void> => {
    try {

        const data = req.body;

        const { name, description, type, price, image } = data;
        if (!name || !type || !image) {
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

// API to delete item
export const deleteItem = async(req:Request, res: Response): Promise<void> => {
    try {
        const {itemId} = req.params;

        if(!checkId({id: itemId, res})) return;

        const item = await StoreItem.findByIdAndDelete(itemId);
        if (!item) 
            return throwError({ message: "Item not found", res, status: 404});

        await User.updateMany(
            { 'purchasedItems.itemId': itemId },
            { $pull: { purchasedItems: { itemId } } }
        );

        console.log("hello")

        res.status(200).json({ message: "Item deleted successfully" });
    } catch (error) {
        return throwError({ message: "Failed to delete. An unknown error occurred.", res, status: 500 });
    }
}

//API to update item
export const updateItem = async (req: Request, res: Response): Promise<void> => {
    try{

        const {itemId} = req.body;

        if(!checkId({id: itemId, res})) return;

        const updateData = { ...req.body };
        delete updateData.itemId; // Remove itemId from the body for comparison

        if (Object.keys(updateData).length === 0) {
            return throwError({ message: "No other data provided to update", res, status: 400 });
        }

        const item = await StoreItem.findByIdAndUpdate(itemId, req.body, {new: true, runValidators: true});

        if(!item){
            return throwError({ message: "Item not found", res, status: 404});
        }

        res.status(200).json({message: "Item Updated Successfully", item});

    }catch(error){
        return throwError({ message: "Failed to update. An unknown error occurred.", res, status: 500 });
    }
};

//API to buy item
export const buyItem = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const user = req.user;
        
        const { itemId } = req.body;

        const item = await StoreItem.findById(itemId);

        if (!item) {
            return throwError({ message: "Item not found", res, status: 404});
        }

        // Check if user already owns the item
        const alreadyPurchased = user.purchasedItems.some(
            (p) => p.itemId.toString() === itemId
        );

        if (alreadyPurchased) {
            return throwError({ message: "Item already purchased", res, status: 400});
        }

        // Check if user has enough coins
        if (user.coins < item.price) {
            return throwError({ message: "Insufficient coins", res, status: 400});
        }

        // Deduct coins and add item to purchases
        user.coins -= item.price;
        user.purchasedItems.push({ 
            itemId: item._id, 
            purchasedAt: new Date() 
        } as IPurchasedItem);

        await user.save();

        res.status(200).json({ message: "Item purchased successfully", item });
    } catch (error) {
        return throwError({ message: "Purchase failed", res, status: 500});
    }
};
