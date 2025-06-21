import { testUtils } from '../setup';
import { createAchievement } from '../../src/controllers/achievement.controller';
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

    // 1. test createAchievement API
    describe('createAchievement', () => {
        const validAchievementData = {
            title: 'Test Achievement',
            description: 'A test achievement description',
            starsReward: 100,
            coinsReward: 50,
            criteria: 'Complete 5 tasks',
            photo: '/assets/images/achievements/test.png',
            type: 'personal'
        };

        it('should create achievement successfully', async () => {
            const mockNewAchievement = testUtils.createMockAchievement(validAchievementData);
            
            // Mock the constructor and save method
            (mockAchievement as any).mockImplementation(() => ({
                ...mockNewAchievement,
                save: jest.fn().mockResolvedValue(mockNewAchievement)
            }));

            const mockReq = testUtils.createMockRequest({ body: validAchievementData });
            const mockRes = testUtils.createMockResponse();

            await createAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Achievement created successfully',
                Achievement: expect.objectContaining({
                    title: 'Test Achievement',
                    type: 'personal'
                })
            });
        });

        it('should use default values for optional fields', async () => {
            const dataWithoutOptionalFields = {
                title: 'Test Achievement',
                description: 'A test achievement',
                criteria: 'Complete tasks',
                photo: '/assets/test.png'
            };

            const mockNewAchievement = testUtils.createMockAchievement({
                ...dataWithoutOptionalFields,
                starsReward: 0,
                coinsReward: 0,
                type: 'personal'
            });

            (mockAchievement as any).mockImplementation(() => ({
                ...mockNewAchievement,
                save: jest.fn().mockResolvedValue(mockNewAchievement)
            }));

            const mockReq = testUtils.createMockRequest({ body: dataWithoutOptionalFields });
            const mockRes = testUtils.createMockResponse();

            await createAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        it('should return 400 if required fields are missing', async () => {
            const incompleteData = { title: 'Test Achievement' }; // Missing required fields

            const mockReq = testUtils.createMockRequest({ body: incompleteData });
            const mockRes = testUtils.createMockResponse();

            await createAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'All required fields must be filled.' 
            });
        });

        it('should return 400 if title is missing', async () => {
            const dataWithoutTitle = { ...validAchievementData };
            delete (dataWithoutTitle as any).title;

            const mockReq = testUtils.createMockRequest({ body: dataWithoutTitle });
            const mockRes = testUtils.createMockResponse();

            await createAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('should handle save errors', async () => {
            (mockAchievement as any).mockImplementation(() => ({
                save: jest.fn().mockRejectedValue(new Error('Save failed'))
            }));

            const mockReq = testUtils.createMockRequest({ body: validAchievementData });
            const mockRes = testUtils.createMockResponse();

            await createAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'An unknown error occurred.' 
            });
        });
    });
});