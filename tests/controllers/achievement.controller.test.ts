import { testUtils } from '../setup';
import { createAchievement, deleteAchievement, getAchievements, getLastFamilyUnlockedAchievement, getLastUnlockedAchievement, getLockedAchievements, getUnLockedAchievements, getUserAchievements, unlockAchievement, unlockFamilyAchievement, updateAchievement } from '../../src/controllers/achievement.controller';
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

    // 6. test getUnLockedAchievements API
    describe('getUnLockedAchievements', () => {
        it('should get unlocked achievements successfully', async () => {
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
            const mockUnlockedAchievements = [
                testUtils.createMockAchievement({ _id: 'achievement1' }),
                testUtils.createMockAchievement({ _id: 'achievement2' })
            ];

            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockAchievement.find.mockResolvedValue(mockUnlockedAchievements as any);

            const mockReq = testUtils.createMockRequest({ user: mockUserData });
            const mockRes = testUtils.createMockResponse();

            await getUnLockedAchievements(mockReq as any, mockRes as any);

            expect(mockAchievement.find).toHaveBeenCalledWith({
                _id: { $in: ['achievement1', 'achievement2'] }
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await getUnLockedAchievements(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
    });

    // 7. test getUserAchievements API
    describe('getUserAchievements', () => {
        it('should get user achievements successfully', async () => {
            const mockUserData = {
                ...testUtils.createMockUser({
                    achievements: [
                        { achievementId: 'achievement1', unlockedAt: new Date() }
                    ]
                }),
                populate: jest.fn().mockResolvedValue(true)
            };

            const mockReq = testUtils.createMockRequest({ user: mockUserData });
            const mockRes = testUtils.createMockResponse();

            await getUserAchievements(mockReq as any, mockRes as any);

            expect(mockUserData.populate).toHaveBeenCalledWith({
                path: 'achievements.achievementId',
                select: 'title description photo'
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Getting user achievements Successfully',
                achievements: mockUserData.achievements
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await getUserAchievements(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
    });

    // 8. test unlockAchievement API
    describe('unlockAchievement', () => {
        const achievementId = testUtils.ids.achievement;

        it('should unlock personal achievement successfully', async () => {
            const mockUserData = testUtils.createMockUser({
                achievements: [],
                save: jest.fn().mockResolvedValue(true)
            });
            const mockAchievementData = testUtils.createMockAchievement({
                type: 'personal'
            });

            mockAchievement.findById.mockResolvedValue(mockAchievementData as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { achievementId }
            });
            const mockRes = testUtils.createMockResponse();

            await unlockAchievement(mockReq as any, mockRes as any);

            expect(mockUserData.achievements).toHaveLength(1);
            expect(mockUserData.achievements[0]).toEqual({
                achievementId,
                unlockedAt: expect.any(Date)
            });
            expect(mockUserData.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ 
                user: null,
                body: { achievementId }
            });
            const mockRes = testUtils.createMockResponse();

            await unlockAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 404 if achievement not found', async () => {
            mockAchievement.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser(),
                body: { achievementId }
            });
            const mockRes = testUtils.createMockResponse();

            await unlockAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Achievement not found' });
        });

        it('should return 400 if achievement already unlocked', async () => {
            const mockUserData = testUtils.createMockUser({
                achievements: [
                    { achievementId, unlockedAt: new Date() }
                ]
            });
            const mockAchievementData = testUtils.createMockAchievement({
                type: 'personal'
            });

            mockAchievement.findById.mockResolvedValue(mockAchievementData as any);
            mockUserData.achievements.find = jest.fn().mockReturnValue(mockUserData.achievements[0]);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { achievementId }
            });
            const mockRes = testUtils.createMockResponse();

            await unlockAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Achievement already unlocked' });
        });

        it('should return 400 if achievement is not personal type', async () => {
            const mockUserData = testUtils.createMockUser({ achievements: [] });
            const mockAchievementData = testUtils.createMockAchievement({
                type: 'family'
            });

            mockAchievement.findById.mockResolvedValue(mockAchievementData as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { achievementId }
            });
            const mockRes = testUtils.createMockResponse();

            await unlockAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'It is not personal achievement' });
        });
    });

    // 9. test unlockFamilyAchievement API
    describe('unlockFamilyAchievement', () => {
        const familyId = testUtils.ids.family;
        const achievementId = testUtils.ids.achievement;

        it('should unlock family achievement successfully', async () => {
            const mockFamilyData = testUtils.createMockFamily({
                achievements: [],
                save: jest.fn().mockResolvedValue(true)
            });
            const mockAchievementData = testUtils.createMockAchievement({
                type: 'family'
            });

            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockAchievement.findById.mockResolvedValue(mockAchievementData as any);

            const mockReq = testUtils.createMockRequest({ 
                body: { familyId, achievementId }
            });
            const mockRes = testUtils.createMockResponse();

            await unlockFamilyAchievement(mockReq as any, mockRes as any);

            expect(mockFamilyData.achievements).toHaveLength(1);
            expect(mockFamilyData.achievements[0]).toEqual({
                achievementId,
                unlockedAt: expect.any(Date)
            });
            expect(mockFamilyData.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if family not found', async () => {
            mockFamily.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ 
                body: { familyId, achievementId }
            });
            const mockRes = testUtils.createMockResponse();

            await unlockFamilyAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Family not found' });
        });

        it('should return 400 if achievement is not family type', async () => {
            const mockFamilyData = testUtils.createMockFamily({ achievements: [] });
            const mockAchievementData = testUtils.createMockAchievement({
                type: 'personal'
            });

            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockAchievement.findById.mockResolvedValue(mockAchievementData as any);

            const mockReq = testUtils.createMockRequest({ 
                body: { familyId, achievementId }
            });
            const mockRes = testUtils.createMockResponse();

            await unlockFamilyAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'It is not family achievement' });
        });
    });

    // 10. test getLastUnlockedAchievement API
    describe('getLastUnlockedAchievement', () => {
        const userId = testUtils.ids.user;

        it('should get last unlocked achievement successfully for authenticated user', async () => {
            const mockUserData = testUtils.createMockUser({
                _id: userId,
                role: 'parent',
                achievements: [
                    { 
                        achievementId: {
                            title: 'First Achievement',
                            photo: '/first.png',
                            description: 'First test description'
                        },
                        unlockedAt: new Date('2024-01-10')
                    },
                    { 
                        achievementId: {
                            title: 'Last Achievement',
                            photo: '/last.png',
                            description: 'Last test description'
                        },
                        unlockedAt: new Date('2024-01-15')
                    }
                ]
            });

            mockUser.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockUserData)
            } as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { userId }
            });
            const mockRes = testUtils.createMockResponse();

            await getLastUnlockedAchievement(mockReq as any, mockRes as any);

            expect(mockUser.findById).toHaveBeenCalledWith(userId);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: 'Retrieve unlocked achievement successfully',
                lastUnlockedAchievement: {
                    title: 'Last Achievement',
                    photo: '/last.png',
                    description: 'Last test description',
                    unlockedAt: expect.any(Date)
                }
            });
        });

        it('should use current user ID when userId not provided in body', async () => {
            const currentUserId = '507f1f77bcf86cd799439099';
            const mockUserData = testUtils.createMockUser({
                _id: currentUserId,
                achievements: [
                    { 
                        achievementId: {
                            title: 'User Achievement',
                            photo: '/user.png',
                            description: 'User description'
                        },
                        unlockedAt: new Date('2024-01-15')
                    }
                ]
            });

            mockUser.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockUserData)
            } as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: {} // No userId provided
            });
            const mockRes = testUtils.createMockResponse();

            await getLastUnlockedAchievement(mockReq as any, mockRes as any);

            expect(mockUser.findById).toHaveBeenCalledWith(currentUserId);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ 
                user: null,
                body: { userId }
            });
            const mockRes = testUtils.createMockResponse();

            await getLastUnlockedAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
            expect(mockUser.findById).not.toHaveBeenCalled();
        });

        it('should return early if checkId fails', async () => {
            mockCheckId.checkId.mockReturnValue(false);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser(),
                body: { userId: 'invalid-id' }
            });
            const mockRes = testUtils.createMockResponse();

            await getLastUnlockedAchievement(mockReq as any, mockRes as any);

            expect(mockUser.findById).not.toHaveBeenCalled();
        });

        it('should return 403 if user not authorized to view target user achievements', async () => {
            const mockUserData = testUtils.createMockUser({
                _id: 'different-user-id',
                role: 'child' // Not parent/admin/owner
            });

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { userId } // Different user ID
            });
            const mockRes = testUtils.createMockResponse();

            await getLastUnlockedAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Forbidden' });
            expect(mockUser.findById).not.toHaveBeenCalled();
        });

        it('should allow parent role to view any user achievements', async () => {
            const mockUserData = testUtils.createMockUser({
                _id: 'parent-user-id',
                role: 'parent'
            });

            const targetUser = testUtils.createMockUser({
                _id: userId,
                achievements: [
                    { 
                        achievementId: {
                            title: 'Child Achievement',
                            photo: '/child.png',
                            description: 'Child description'
                        },
                        unlockedAt: new Date('2024-01-15')
                    }
                ]
            });

            mockUser.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(targetUser)
            } as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { userId }
            });
            const mockRes = testUtils.createMockResponse();

            await getLastUnlockedAchievement(mockReq as any, mockRes as any);

            expect(mockUser.findById).toHaveBeenCalledWith(userId);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should allow admin role to view any user achievements', async () => {
            const mockUserData = testUtils.createMockUser({
                _id: 'admin-user-id',
                role: 'admin'
            });

            const targetUser = testUtils.createMockUser({
                achievements: [
                    { 
                        achievementId: {
                            title: 'Admin View Achievement',
                            photo: '/admin.png',
                            description: 'Admin view description'
                        },
                        unlockedAt: new Date('2024-01-15')
                    }
                ]
            });

            mockUser.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(targetUser)
            } as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { userId }
            });
            const mockRes = testUtils.createMockResponse();

            await getLastUnlockedAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if target user not found', async () => {
            const mockUserData = testUtils.createMockUser({ role: 'parent' });

            mockUser.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            } as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { userId }
            });
            const mockRes = testUtils.createMockResponse();

            await getLastUnlockedAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        it('should handle user with no achievements', async () => {
            const mockUserData = testUtils.createMockUser({
                achievements: [] // Empty achievements array
            });

            mockUser.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockUserData)
            } as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { userId }
            });
            const mockRes = testUtils.createMockResponse();

            await getLastUnlockedAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: 'No achievements'
            });
        });

        it('should handle database errors and return 500', async () => {
            const mockUserData = testUtils.createMockUser({ role: 'parent' });

            mockUser.findById.mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error('Database connection failed'))
            } as any);

            // Mock console.error to avoid log output during tests
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { userId }
            });
            const mockRes = testUtils.createMockResponse();

            await getLastUnlockedAchievement(mockReq as any, mockRes as any);
            
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'An error occurred while getting last unlocked achievement.' });

            consoleErrorSpy.mockRestore();
        });

        it('should populate achievements with correct fields', async () => {
            const mockUserData = testUtils.createMockUser({
                achievements: [
                    { 
                        achievementId: {
                            title: 'Test Achievement',
                            photo: '/test.png',
                            description: 'Test description'
                        },
                        unlockedAt: new Date('2024-01-15')
                    }
                ]
            });

            const populateMock = jest.fn().mockResolvedValue(mockUserData);
            mockUser.findById.mockReturnValue({ populate: populateMock } as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { userId }
            });
            const mockRes = testUtils.createMockResponse();

            await getLastUnlockedAchievement(mockReq as any, mockRes as any);

            expect(populateMock).toHaveBeenCalledWith({
                path: "achievements.achievementId",
                select: "title photo description"
            });
        });
    });

    // 11. test getLastFamilyUnlockedAchievement API
    describe('getLastFamilyUnlockedAchievement', () => {
        const familyId = testUtils.ids.family;

        it('should get last family unlocked achievement successfully', async () => {
            const mockFamilyData = testUtils.createMockFamily({
                _id: familyId,
                achievements: [
                    { 
                        achievementId: {
                            title: 'First Family Achievement',
                            photo: '/family1.png',
                            description: 'First family description'
                        },
                        unlockedAt: new Date('2024-01-10')
                    },
                    { 
                        achievementId: {
                            title: 'Latest Family Achievement',
                            photo: '/family2.png',
                            description: 'Latest family description'
                        },
                        unlockedAt: new Date('2024-01-20')
                    }
                ]
            });

            mockFamily.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockFamilyData)
            } as any);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser(),
                body: { familyId }
            });
            const mockRes = testUtils.createMockResponse();

            await getLastFamilyUnlockedAchievement(mockReq as any, mockRes as any);

            expect(mockFamily.findById).toHaveBeenCalledWith(familyId);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: 'Retrieve last unlocked family achievement successfully',
                lastUnlockedAchievement: {
                    title: 'Latest Family Achievement',
                    photo: '/family2.png',
                    description: 'Latest family description',
                    unlockedAt: expect.any(Date)
                }
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ 
                user: null,
                body: { familyId }
            });
            const mockRes = testUtils.createMockResponse();

            await getLastFamilyUnlockedAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
            expect(mockFamily.findById).not.toHaveBeenCalled();
        });

        it('should return early if checkId fails for familyId', async () => {
            mockCheckId.checkId.mockReturnValue(false);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser(),
                body: { familyId: 'invalid-family-id' }
            });
            const mockRes = testUtils.createMockResponse();

            await getLastFamilyUnlockedAchievement(mockReq as any, mockRes as any);

            expect(mockFamily.findById).not.toHaveBeenCalled();
        });

        it('should return 404 if family not found', async () => {
            mockFamily.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            } as any);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser(),
                body: { familyId }
            });
            const mockRes = testUtils.createMockResponse();

            await getLastFamilyUnlockedAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Family not found' });
        });

        it('should handle family with no achievements', async () => {
            const mockFamilyData = testUtils.createMockFamily({
                achievements: [] // Empty achievements array
            });

            mockFamily.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockFamilyData)
            } as any);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser(),
                body: { familyId }
            });
            const mockRes = testUtils.createMockResponse();

            await getLastFamilyUnlockedAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: 'No achievements'
            });
        });

        it('should handle database errors and return 500', async () => {
            mockFamily.findById.mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error('Family database error'))
            } as any);

            // Mock console.error to avoid log output during tests
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser(),
                body: { familyId }
            });
            const mockRes = testUtils.createMockResponse();

            await getLastFamilyUnlockedAchievement(mockReq as any, mockRes as any);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'An error occurred while getting last unlocked family achievement.' });

            consoleErrorSpy.mockRestore();
        });

        it('should populate family achievements with correct fields', async () => {
            const mockFamilyData = testUtils.createMockFamily({
                achievements: [
                    { 
                        achievementId: {
                            title: 'Family Test Achievement',
                            photo: '/family-test.png',
                            description: 'Family test description'
                        },
                        unlockedAt: new Date('2024-01-15')
                    }
                ]
            });

            const populateMock = jest.fn().mockResolvedValue(mockFamilyData);
            mockFamily.findById.mockReturnValue({ populate: populateMock } as any);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser(),
                body: { familyId }
            });
            const mockRes = testUtils.createMockResponse();

            await getLastFamilyUnlockedAchievement(mockReq as any, mockRes as any);

            expect(populateMock).toHaveBeenCalledWith({
                path: "achievements.achievementId",
                select: "title photo description"
            });
        });

        it('should handle single achievement correctly', async () => {
            const mockFamilyData = testUtils.createMockFamily({
                achievements: [
                    { 
                        achievementId: {
                            title: 'Only Family Achievement',
                            photo: '/only.png',
                            description: 'Only description'
                        },
                        unlockedAt: new Date('2024-01-15')
                    }
                ]
            });

            mockFamily.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockFamilyData)
            } as any);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser(),
                body: { familyId }
            });
            const mockRes = testUtils.createMockResponse();

            await getLastFamilyUnlockedAchievement(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: 'Retrieve last unlocked family achievement successfully',
                lastUnlockedAchievement: {
                    title: 'Only Family Achievement',
                    photo: '/only.png',
                    description: 'Only description',
                    unlockedAt: expect.any(Date)
                }
            });
        });

        it('should handle missing familyId in request body', async () => {
            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser(),
                body: {} // No familyId provided
            });
            const mockRes = testUtils.createMockResponse();

            // checkId should return false for undefined familyId
            mockCheckId.checkId.mockReturnValue(false);

            await getLastFamilyUnlockedAchievement(mockReq as any, mockRes as any);

            expect(mockFamily.findById).not.toHaveBeenCalled();
        });
    });
});