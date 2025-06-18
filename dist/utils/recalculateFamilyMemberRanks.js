"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalculateFamilyMemberRanks = void 0;
const user_model_1 = require("../models/user.model");
// Helper function to recalculate ranks within the family
const recalculateFamilyMemberRanks = (familyId, updatedUser) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const familyMembers = yield user_model_1.User.find({ familyId })
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
            return member.save(); // Save all members
        });
        yield Promise.all(savePromises); // Save all members in parallel
    }
    catch (error) {
        console.error("Error recalculating ranks:", error);
    }
});
exports.recalculateFamilyMemberRanks = recalculateFamilyMemberRanks;
