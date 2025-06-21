import { testUtils } from '../setup';
import {
    createGoal, getGoals, getGoalById, updateUserGoal, deleteGoal,
    createUserTask, getTaskById, updateTask, deleteTask, completeTask,
    getMonthlyStats
} from '../../src/controllers/goal.controller';
import { User } from '../../src/models/user.model';
import { Family } from '../../src/models/family.model';
import { Achievement } from '../../src/models/achievements.model';
import * as checkId from '../../src/utils/checkId';
import * as recalculateFamilyMemberRanks from '../../src/utils/recalculateFamilyMemberRanks';
import { startOfMonth, endOfMonth } from 'date-fns';

// Mock all dependencies
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/family.model');
jest.mock('../../src/models/achievements.model');
jest.mock('../../src/utils/checkId');
jest.mock('../../src/utils/recalculateFamilyMemberRanks');

const mockUser = User as jest.Mocked<typeof User>;
const mockFamily = Family as jest.Mocked<typeof Family>;
const mockAchievement = Achievement as jest.Mocked<typeof Achievement>;
const mockCheckId = checkId as jest.Mocked<typeof checkId>;
const mockRecalculateFamilyMemberRanks = recalculateFamilyMemberRanks as jest.Mocked<typeof recalculateFamilyMemberRanks>;

describe('Goal Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup model methods
        mockUser.findById = jest.fn();
        mockUser.findOneAndUpdate = jest.fn();
        mockUser.find = jest.fn();
        mockFamily.findById = jest.fn();
        mockFamily.findOneAndUpdate = jest.fn();
        mockFamily.findByIdAndUpdate = jest.fn();
        mockFamily.find = jest.fn();
        mockAchievement.findById = jest.fn();
        
        // Setup utility mocks
        mockCheckId.checkId.mockReturnValue(true);
        jest.spyOn(mockRecalculateFamilyMemberRanks, 'recalculateFamilyMemberRanks').mockResolvedValue(undefined);
    });

});