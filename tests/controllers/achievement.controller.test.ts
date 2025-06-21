import { Achievement } from '../../src/models/achievements.model';
import { User } from '../../src/models/user.model';
import { Family } from '../../src/models/family.model';
import * as checkId from '../../src/utils/checkId';

// Mock all dependencies
jest.mock('../../src/models/achievements.model');
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/family.model');
jest.mock('../../src/utils/checkId');

const mockAchievement = Achievement as jest.Mocked<typeof Achievement>;
const mockUser = User as jest.Mocked<typeof User>;
const mockFamily = Family as jest.Mocked<typeof Family>;
const mockCheckId = checkId as jest.Mocked<typeof checkId>;

describe('Achievements Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup model methods
        mockAchievement.find = jest.fn();
        mockAchievement.findById = jest.fn();
        mockAchievement.findByIdAndDelete = jest.fn();
        mockAchievement.findByIdAndUpdate = jest.fn();
        mockUser.updateMany = jest.fn();
        mockUser.findById = jest.fn();
        mockFamily.updateMany = jest.fn();
        mockFamily.findById = jest.fn();
        
        // Setup utility mocks
        mockCheckId.checkId.mockReturnValue(true);
    });

});