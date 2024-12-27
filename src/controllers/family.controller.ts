import { Request, Response } from "express";
import { Family } from "../models/family.model";
import { throwError } from "../utils/error";
import { User } from "../models/user.model";
import { checkId } from "../utils/checkId";
import { CustomRequest } from "../interfaces/customRequest";

//API get all families
export const getAllFamilies = async (req: Request, res: Response): Promise<void> => {
    try {
        const families = await Family.find();
        
        if (!families || families.length === 0) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        res.status(200).send({ message:"Retrieving all families successfully", families });
    } catch (error) {
        return throwError({ message: "Failed to retrieve all families.", res, status: 500 });
    }
};

// Get Family by ID
export const getFamily = async (req: Request, res: Response): Promise<void> => {
    try {
        const { familyId } = req.body;
        const family = await Family.findById(familyId);
        
        if (!family) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        res.status(200).send({ message:"Retrieving family successfully", family });
    } catch (error) {
        return throwError({ message: "Failed to retrieve family.", res, status: 500 });
    }
};

// Get family members of a family
export const getFamilyMembers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { familyId } = req.body;
        
        // Find family and populate members with full user details
        const family = await Family.findById(familyId).populate({ path: "members._id", model: "User"}).lean();

        if (!family) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        // Flatten the structure to avoid `_id` nesting
        const familyWithMembers = {
            ...family,
            members: family.members.map(member => ({
                ...member._id,
                role: member.role
            }))
        };

        res.status(200).json({ message:"Retrieving family members successfully", familyWithMembers});

    } catch (error) {
        return throwError({ message: "Failed to retrieve family members.", res, status: 500 });
    }
};

// Update Family Details
export const updateFamily = async (req: CustomRequest, res: Response): Promise<void> => {
    try {

        if(!req.user || (req.user.role !== 'parent' && req.user.role !== 'admin' && req.user.role !== 'owner')){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { familyId, familyName, email } = req.body;
        if(!checkId({id: familyId, res})) return;

        
        const family = await Family.findById(familyId);

        if (!family) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        if(req.user.email !== family.email && req.user.role !== "admin"){
            return throwError({ message: "Forbidden", res, status: 401 });
        }

        family.familyName = familyName || family.familyName;
        family.email = email || family.email;

        if (email) {
            await User.updateMany(
                { familyId: familyId }, 
                { $set: { email: email } }
            );
        }

        await family.save();

        res.status(200).send({ message: "Family updated successfully.", family: family });
    } catch (error) {
        return throwError({ message: "Failed to update family.", res, status: 500 });
    }
};

//API to delete family
export const deleteFamily = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        // Check for authorized user roles
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'parent')) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { familyId } = req.body;

        // Check if familyId is valid
        if (!checkId({ id: familyId, res })) return;

        // Find the family to delete
        const family = await Family.findById(familyId);

        if (!family) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        // Delete all users associated with the family
        await User.deleteMany({ familyId });

        // Delete the family
        await Family.findByIdAndDelete(familyId);

        res.status(200).send({ message: "Family and all associated members deleted successfully." });
    } catch (error) {
        return throwError({ message: "Failed to delete family.", res, status: 500 });
    }
};
