import { createChallenge, getAllChallenges } from '../../src/controllers/challenge.controller';
import { Adventure } from '../../src/models/adventure.model';
import * as checkId from '../../src/utils/checkId';
import { testUtils } from '../setup';

// Mock all dependencies
jest.mock('../../src/models/adventure.model');
jest.mock('../../src/utils/checkId');

const mockAdventure = Adventure as jest.Mocked<typeof Adventure>;
const mockCheckId = checkId as jest.Mocked<typeof checkId>;

describe('Challenge Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup model methods
        mockAdventure.findById = jest.fn();
        
        // Setup utility mocks
        mockCheckId.checkId.mockReturnValue(true);
    });

    // 1. test createChallenge API
    describe('createChallenge', () => {
        const adventureId = testUtils.ids.adventure;
        const validChallengeData = {
            adventureId,
            title: 'New Challenge',
            content: 'New challenge content',
            starsReward: 15,
            coinsReward: 8
        };

        it('should create challenge successfully with all fields', async () => {
            const mockAdventureData = testUtils.createMockAdventureWithChallenges([]);
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({ body: validChallengeData });
            const mockRes = testUtils.createMockResponse();

            await createChallenge(mockReq as any, mockRes as any);

            expect(mockAdventure.findById).toHaveBeenCalledWith(adventureId);
            expect(mockAdventureData.challenges.push).toHaveBeenCalledWith({
                title: 'New Challenge',
                content: 'New challenge content',
                starsReward: 15,
                coinsReward: 8
            });
            expect(mockAdventureData.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Challenge created successfully',
                Challenge: {
                    title: 'New Challenge',
                    content: 'New challenge content',
                    starsReward: 15,
                    coinsReward: 8
                }
            });
        });

        it('should create challenge with default rewards when not provided', async () => {
            const dataWithoutRewards = {
                adventureId,
                title: 'Default Challenge',
                content: 'Default challenge content'
            };

            const mockAdventureData = testUtils.createMockAdventureWithChallenges([]);
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({ body: dataWithoutRewards });
            const mockRes = testUtils.createMockResponse();

            await createChallenge(mockReq as any, mockRes as any);

            expect(mockAdventureData.challenges.push).toHaveBeenCalledWith({
                title: 'Default Challenge',
                content: 'Default challenge content',
                starsReward: 2,
                coinsReward: 1
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        it('should return 400 if required fields are missing', async () => {
            const incompleteData = {
                adventureId,
                title: 'Incomplete Challenge'
                // Missing content
            };

            // Mock a valid adventure so we get past the adventure existence check
            const mockAdventureData = testUtils.createMockAdventureWithChallenges([]);
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({ body: incompleteData });
            const mockRes = testUtils.createMockResponse();

            await createChallenge(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'All required fields must be filled.'
            });
        });

        it('should return 400 if title is missing', async () => {
            const dataWithoutTitle = {
                adventureId,
                content: 'Content without title'
            };

            // Mock a valid adventure so we get past the adventure existence check
            const mockAdventureData = testUtils.createMockAdventureWithChallenges([]);
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({ body: dataWithoutTitle });
            const mockRes = testUtils.createMockResponse();

            await createChallenge(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'All required fields must be filled.'
            });
        });
        it('should return early if adventureId checkId fails', async () => {
            mockCheckId.checkId.mockReturnValue(false);

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId: 'invalid-id', title: 'Test', content: 'Test' }
            });
            const mockRes = testUtils.createMockResponse();

            await createChallenge(mockReq as any, mockRes as any);

            expect(mockAdventure.findById).not.toHaveBeenCalled();
        });

        it('should return 404 if adventure not found', async () => {
            mockAdventure.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ body: validChallengeData });
            const mockRes = testUtils.createMockResponse();

            await createChallenge(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Adventure not found'
            });
        });

        it('should handle database save errors', async () => {
            const mockAdventureData = testUtils.createMockAdventureWithChallenges([]);
            mockAdventureData.save = jest.fn().mockRejectedValue(new Error('Save failed'));
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({ body: validChallengeData });
            const mockRes = testUtils.createMockResponse();

            await createChallenge(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'An unknown error occurred while creating.'
            });
        });
    });
});