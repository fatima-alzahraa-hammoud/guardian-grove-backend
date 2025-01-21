import { Types } from "mongoose";
import { User } from "../models/user.model";
import { IUser } from "../interfaces/IUser";

// Helper function to recalculate ranks within the family
export const recalculateFamilyMemberRanks = async (familyId: Types.ObjectId, updatedUser: IUser): Promise<void> => {
    try {
        const familyMembers = await User.find({ familyId })
            .sort({ stars: -1, nbOfTasksCompleted: -1 })
            .exec();

        let rank = 0;
        let prevStars = 0;
        let prevTasks = 0;

        const savePromises = familyMembers.map((member, index) => {
            if (prevStars !== member.stars || prevTasks !== member.nbOfTasksCompleted) {
                rank++;
            }

            member.rankInFamily = rank;
            
            // Update req.user directly if it's the same member
            if (updatedUser._id.equals(member._id)) {
                updatedUser.rankInFamily = rank;
            }

            prevStars = member.stars;
            prevTasks = member.nbOfTasksCompleted;

            return member.save();  // Save all members
        });

        await Promise.all(savePromises);  // Save all members in parallel
    } catch (error) {
        console.error("Error recalculating ranks:", error);
    }
};