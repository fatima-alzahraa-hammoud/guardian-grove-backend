import { Types } from "mongoose";
import { User } from "../models/user.model";
import { IUser } from "../interfaces/IUser";

export const recalculateFamilyMemberRanks = async (familyId: Types.ObjectId, updatedUser: IUser): Promise<void> => {
    try {
        const familyMembers = await User.find({ familyId })
            .sort({ stars: -1, nbOfTasksCompleted: -1 })
            .exec();
        
        let rank = 1;
        let prevStars: number | null = null; 
        let prevTasks: number | null = null; 
        
        const savePromises = familyMembers.map((member, index) => {
            // For first member or when stats differ from previous member
            if (index === 0 || prevStars !== member.stars || prevTasks !== member.nbOfTasksCompleted) {
                rank = index + 1;
            }
            
            member.rankInFamily = rank;
            
            // Update req.user directly if it's the same member
            if (updatedUser._id.equals(member._id)) {
                updatedUser.rankInFamily = rank;
            }
            
            prevStars = member.stars;
            prevTasks = member.nbOfTasksCompleted;
            return member.save();
        });
        
        await Promise.all(savePromises);
    } catch (error) {
        console.error("Error recalculating ranks:", error);
    }
};