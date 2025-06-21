import { testUtils } from '../setup';
import { createAchievement, deleteAchievement, getAchievements, getLockedAchievements, updateAchievement } from '../../src/controllers/achievement.controller';
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

    // 2. test updateAchievement API
    describe('updateAchievement', () => {
        const achievementId = testUtils.ids.achievement;
        const updateData = {
            achievementId,
            title: 'Updated Achievement',
            starsReward: 150
        };

        it('should update achievement successfully', async () => {
            const mockUpdatedAchievement = testUtils.createMockAchievement({
                title: 'Updated Achievement',
                starsReward: 150
            });
            
            mockAchievement.findByIdAndUpdate.mockResolvedValue(mockUpdatedAchievement as any);

            const mockReq = testUtils.createMockRequest({ body: updateData });
            const mockRes = testUtils.createMockResponse();

            await updateAchievement(mockReq as any, mockRes as any);

            expect(mockAchievement.findByIdAndUpdate).toHaveBeenCalledWith(
                achievementId,
                updateData,
                { new: true, runValidators: true }
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Achievement Updated Successfully',
                achievement: mockUpdatedAchievement
            });
        });

        it('should return 400 if no update data provided', async () => {
            const onlyAchievementId = { achievementId };

            const mockReq = testUtils.createMockRequest({ body: onlyAchievementId });
            const mockRes = testUtils.createMockResponse();

            await updateAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'No other data provided to update' 
            });
        });

        it('should return 404 if achievement not found', async () => {
            mockAchievement.findByIdAndUpdate.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ body: updateData });
            const mockRes = testUtils.createMockResponse();

            await updateAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Achievement not found' 
            });
        });

        it('should return early if checkId fails', async () => {
            mockCheckId.checkId.mockReturnValue(false);

            const mockReq = testUtils.createMockRequest({ body: { achievementId: 'invalid-id' } });
            const mockRes = testUtils.createMockResponse();

            await updateAchievement(mockReq as any, mockRes as any);

            expect(mockAchievement.findByIdAndUpdate).not.toHaveBeenCalled();
        });
    });

    // 3. test deleteAchievement API
    describe('deleteAchievement', () => {
        const achievementId = testUtils.ids.achievement;

        it('should delete achievement successfully', async () => {
            const mockDeletedAchievement = testUtils.createMockAchievement();
            
            mockAchievement.findByIdAndDelete.mockResolvedValue(mockDeletedAchievement as any);
            mockUser.updateMany.mockResolvedValue({ modifiedCount: 2 } as any);
            mockFamily.updateMany.mockResolvedValue({ modifiedCount: 1 } as any);

            const mockReq = testUtils.createMockRequest({ body: { achievementId } });
            const mockRes = testUtils.createMockResponse();

            await deleteAchievement(mockReq as any, mockRes as any);

            expect(mockAchievement.findByIdAndDelete).toHaveBeenCalledWith(achievementId);
            expect(mockUser.updateMany).toHaveBeenCalledWith(
                { 'achievements.achievementId': achievementId },
                { $pull: { achievements: { achievementId } } }
            );
            expect(mockFamily.updateMany).toHaveBeenCalledWith(
                { 'achievements.achievementId': achievementId },
                { $pull: { achievements: { achievementId } } }
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Achievement deleted successfully',
                achievement: mockDeletedAchievement
            });
        });

        it('should return 404 if achievement not found', async () => {
            mockAchievement.findByIdAndDelete.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ body: { achievementId } });
            const mockRes = testUtils.createMockResponse();

            await deleteAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Achievement not found' 
            });
        });

        it('should return early if checkId fails', async () => {
            mockCheckId.checkId.mockReturnValue(false);

            const mockReq = testUtils.createMockRequest({ body: { achievementId: 'invalid-id' } });
            const mockRes = testUtils.createMockResponse();

            await deleteAchievement(mockReq as any, mockRes as any);

            expect(mockAchievement.findByIdAndDelete).not.toHaveBeenCalled();
        });
    });

    // 4. test getAchievements API
    describe('getAchievements', () => {
        it('should get all achievements when no type specified', async () => {
            const mockAchievements = [
                testUtils.createMockAchievement({ type: 'personal' }),
                testUtils.createMockAchievement({ type: 'family' })
            ];
            
            mockAchievement.find.mockResolvedValue(mockAchievements as any);

            const mockReq = testUtils.createMockRequest({ query: {} });
            const mockRes = testUtils.createMockResponse();

            await getAchievements(mockReq as any, mockRes as any);

            expect(mockAchievement.find).toHaveBeenCalledWith({});
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Getting all achievements Successfully',
                achievements: mockAchievements
            });
        });

        it('should get achievements by type', async () => {
            const mockAchievements = [testUtils.createMockAchievement({ type: 'personal' })];
            
            mockAchievement.find.mockResolvedValue(mockAchievements as any);

            const mockReq = testUtils.createMockRequest({ query: { type: 'personal' } });
            const mockRes = testUtils.createMockResponse();

            await getAchievements(mockReq as any, mockRes as any);

            expect(mockAchievement.find).toHaveBeenCalledWith({ type: 'personal' });
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should get all achievements when type is "All"', async () => {
            const mockAchievements = [testUtils.createMockAchievement()];
            
            mockAchievement.find.mockResolvedValue(mockAchievements as any);

            const mockReq = testUtils.createMockRequest({ query: { type: 'All' } });
            const mockRes = testUtils.createMockResponse();

            await getAchievements(mockReq as any, mockRes as any);

            expect(mockAchievement.find).toHaveBeenCalledWith({});
        });

        it('should return 404 if no achievements found', async () => {
            mockAchievement.find.mockResolvedValue([]);

            const mockReq = testUtils.createMockRequest({ query: {} });
            const mockRes = testUtils.createMockResponse();

            await getAchievements(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'No achievements found' 
            });
        });
    });

    // 5. test getLockedAchievements API
    describe('getLockedAchievements', () => {
        it('should get locked achievements successfully', async () => {
            const mockUserData = testUtils.createMockUser({
                achievements: [
                    { achievementId: 'achievement1', unlockedAt: new Date() }
                ]
            });
            const mockFamilyData = testUtils.createMockFamily({
                achievements: [
                    { achievementId: 'achievement2', unlockedAt: new Date() }
                ]
            });
            const mockLockedAchievements = [
                testUtils.createMockAchievement({ _id: 'achievement3' })
            ];

            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockAchievement.find.mockResolvedValue(mockLockedAchievements as any);

            const mockReq = testUtils.createMockRequest({ user: mockUserData });
            const mockRes = testUtils.createMockResponse();

            await getLockedAchievements(mockReq as any, mockRes as any);

            expect(mockAchievement.find).toHaveBeenCalledWith({
                _id: { $nin: ['achievement1', 'achievement2'] }
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Getting locked achievements Successfully',
                achievements: mockLockedAchievements
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await getLockedAchievements(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should handle case when user has no family', async () => {
            const mockUserData = testUtils.createMockUser({
                familyId: null,
                achievements: []
            });

            mockFamily.findById.mockResolvedValue(null);
            mockAchievement.find.mockResolvedValue([]);

            const mockReq = testUtils.createMockRequest({ user: mockUserData });
            const mockRes = testUtils.createMockResponse();

            await getLockedAchievements(mockReq as any, mockRes as any);

            expect(mockAchievement.find).toHaveBeenCalledWith({
                _id: { $nin: [] }
            });
        });
    });
});