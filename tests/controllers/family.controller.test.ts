import { Family } from '../../src/models/family.model';
import { User } from '../../src/models/user.model';
import { Achievement } from '../../src/models/achievements.model';
import * as checkId from '../../src/utils/checkId';
import * as recalculateFamilyMemberRanks from '../../src/utils/recalculateFamilyMemberRanks';
import * as getTimePeriod from '../../src/utils/getTimePeriod';

// Mock all dependencies
jest.mock('../../src/models/family.model');
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/achievements.model');
jest.mock('../../src/utils/checkId');
jest.mock('../../src/utils/recalculateFamilyMemberRanks');
jest.mock('../../src/utils/getTimePeriod');

const mockFamily = Family as jest.Mocked<typeof Family>;
const mockUser = User as jest.Mocked<typeof User>;
const mockAchievement = Achievement as jest.Mocked<typeof Achievement>;
const mockCheckId = checkId as jest.Mocked<typeof checkId>;
const mockRecalculateFamilyMemberRanks = recalculateFamilyMemberRanks as jest.Mocked<typeof recalculateFamilyMemberRanks>;
const mockGetTimePeriod = getTimePeriod as jest.Mocked<typeof getTimePeriod>;

describe('Family Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup Family model methods
        mockFamily.find = jest.fn();
        mockFamily.findOne = jest.fn();
        mockFamily.findById = jest.fn();
        mockFamily.findByIdAndDelete = jest.fn();
        mockFamily.findByIdAndUpdate = jest.fn();
        mockFamily.countDocuments = jest.fn();

        // Setup User model methods
        mockUser.find = jest.fn();
        mockUser.findById = jest.fn();
        mockUser.updateMany = jest.fn();
        mockUser.deleteMany = jest.fn();
        mockUser.aggregate = jest.fn();

        // Setup Achievement model methods
        mockAchievement.findById = jest.fn();
        mockAchievement.countDocuments = jest.fn();
        
        // Setup utility mocks
        mockCheckId.checkId.mockReturnValue(true);
        jest.spyOn(mockRecalculateFamilyMemberRanks, 'recalculateFamilyMemberRanks').mockResolvedValue(undefined);
        mockGetTimePeriod.getTimePeriod.mockReturnValue({
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31')
        });
    });
});