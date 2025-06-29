import { createChallenge, deleteChallenge, getAllChallenges, getChallengeById, updateChallenge } from '../../src/controllers/challenge.controller';
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

    // 2. test getAllChallenges API
    describe('getAllChallenges', () => {
        const adventureId = testUtils.ids.adventure;

        it('should get all challenges successfully', async () => {
            const challenges = [
                {
                    _id: 'challenge1',
                    title: 'Challenge 1',
                    content: 'Content 1',
                    starsReward: 10,
                    coinsReward: 5
                },
                {
                    _id: 'challenge2',
                    title: 'Challenge 2',
                    content: 'Content 2',
                    starsReward: 15,
                    coinsReward: 8
                }
            ];
            const mockAdventureData = testUtils.createMockAdventureWithChallenges(challenges);
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({ body: { adventureId } });
            const mockRes = testUtils.createMockResponse();

            await getAllChallenges(mockReq as any, mockRes as any);

            expect(mockAdventure.findById).toHaveBeenCalledWith(adventureId);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Retrieving challenges successfully',
                Challenges: challenges
            });
        });

        it('should return empty array if adventure has no challenges', async () => {
            // Create a mock adventure with explicitly empty challenges array
            const mockAdventureData = {
                _id: adventureId,
                title: 'Test Adventure',
                description: 'Test adventure description',
                starsReward: 20,
                coinsReward: 10,
                challenges: [], // Explicitly empty array
                save: jest.fn().mockResolvedValue(true)
            };
            
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({ body: { adventureId } });
            const mockRes = testUtils.createMockResponse();

            await getAllChallenges(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Retrieving challenges successfully',
                Challenges: []
            });
        });

        it('should return early if adventureId checkId fails', async () => {
            mockCheckId.checkId.mockReturnValue(false);

            const mockReq = testUtils.createMockRequest({ body: { adventureId: 'invalid-id' } });
            const mockRes = testUtils.createMockResponse();

            await getAllChallenges(mockReq as any, mockRes as any);

            expect(mockAdventure.findById).not.toHaveBeenCalled();
        });

        it('should return 404 if adventure not found', async () => {
            mockAdventure.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ body: { adventureId } });
            const mockRes = testUtils.createMockResponse();

            await getAllChallenges(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Adventure not found'
            });
        });

        it('should handle database errors', async () => {
            mockAdventure.findById.mockRejectedValue(new Error('Database error'));

            const mockReq = testUtils.createMockRequest({ body: { adventureId } });
            const mockRes = testUtils.createMockResponse();

            await getAllChallenges(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'An unknown error occurred while getting all challenges.'
            });
        });
    });

    // 3. test getChallengeById API
    describe('getChallengeById', () => {
        const adventureId = testUtils.ids.adventure;
        const challengeId = testUtils.ids.challenge;

        it('should get challenge by id successfully', async () => {
            const targetChallenge = {
                _id: challengeId,
                title: 'Target Challenge',
                content: 'Target content',
                starsReward: 20,
                coinsReward: 10,
                toString: jest.fn(() => challengeId)
            };

            const mockAdventureData = testUtils.createMockAdventureWithChallenges([targetChallenge]);
            mockAdventureData.challenges.find = jest.fn().mockReturnValue(targetChallenge);
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId, challengeId }
            });
            const mockRes = testUtils.createMockResponse();

            await getChallengeById(mockReq as any, mockRes as any);

            expect(mockAdventure.findById).toHaveBeenCalledWith(adventureId);
            expect(mockAdventureData.challenges.find).toHaveBeenCalledWith(expect.any(Function));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Retrieving challenge successfully',
                Challenges: targetChallenge
            });
        });

        it('should return early if adventureId checkId fails', async () => {
            mockCheckId.checkId.mockReturnValueOnce(false).mockReturnValueOnce(true);

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId: 'invalid-adventure-id', challengeId }
            });
            const mockRes = testUtils.createMockResponse();

            await getChallengeById(mockReq as any, mockRes as any);

            expect(mockAdventure.findById).not.toHaveBeenCalled();
        });

        it('should return early if challengeId checkId fails', async () => {
            mockCheckId.checkId.mockReturnValueOnce(false);

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId, challengeId: 'invalid-challenge-id' }
            });
            const mockRes = testUtils.createMockResponse();

            await getChallengeById(mockReq as any, mockRes as any);

            expect(mockAdventure.findById).not.toHaveBeenCalled();
        });

        it('should return 404 if adventure not found', async () => {
            mockAdventure.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId, challengeId }
            });
            const mockRes = testUtils.createMockResponse();

            await getChallengeById(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Adventure not found'
            });
        });

        it('should return 404 if challenge not found in adventure', async () => {
            const mockAdventureData = testUtils.createMockAdventureWithChallenges([]);
            mockAdventureData.challenges.find = jest.fn().mockReturnValue(undefined);
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId, challengeId }
            });
            const mockRes = testUtils.createMockResponse();

            await getChallengeById(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Challenge not found'
            });
        });

        it('should handle database errors', async () => {
            mockAdventure.findById.mockRejectedValue(new Error('Database error'));

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId, challengeId }
            });
            const mockRes = testUtils.createMockResponse();

            await getChallengeById(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'An unknown error occurred while getting challenge.'
            });
        });
    });

    // 4. test updateChallenge API 
    describe('updateChallenge', () => {
        const adventureId = testUtils.ids.adventure;
        const challengeId = testUtils.ids.challenge;

        it('should update challenge successfully', async () => {
            const updateData = {
                adventureId,
                challengeId,
                title: 'Updated Challenge',
                starsReward: 25
            };

            const targetChallenge = {
                _id: challengeId,
                title: 'Original Challenge',
                content: 'Original content',
                starsReward: 10,
                coinsReward: 5,
                toString: jest.fn(() => challengeId)
            };

            const mockAdventureData = testUtils.createMockAdventureWithChallenges([targetChallenge]);
            mockAdventureData.challenges.find = jest.fn().mockReturnValue(targetChallenge);
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({ body: updateData });
            const mockRes = testUtils.createMockResponse();

            await updateChallenge(mockReq as any, mockRes as any);

            expect(mockAdventure.findById).toHaveBeenCalledWith(adventureId);
            expect(mockAdventureData.challenges.find).toHaveBeenCalledWith(expect.any(Function));
            
            // Verify Object.assign was called with the challenge and update data
            expect(targetChallenge.title).toBe('Updated Challenge');
            expect(targetChallenge.starsReward).toBe(25);
            
            expect(mockAdventureData.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Updating challenge successfully',
                Challenges: targetChallenge
            });
        });

        it('should return 400 if no update data provided', async () => {
            const onlyIds = { adventureId, challengeId };

            const mockReq = testUtils.createMockRequest({ body: onlyIds });
            const mockRes = testUtils.createMockResponse();

            await updateChallenge(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'No other data provided to update'
            });
        });

        it('should return early if adventureId checkId fails', async () => {
            mockCheckId.checkId.mockReturnValueOnce(false).mockReturnValueOnce(true);

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId: 'invalid-id', challengeId, title: 'Update' }
            });
            const mockRes = testUtils.createMockResponse();

            await updateChallenge(mockReq as any, mockRes as any);

            expect(mockAdventure.findById).not.toHaveBeenCalled();
        });

        it('should return early if challengeId checkId fails', async () => {
            // First call (adventureId) should pass, second call (challengeId) should fail
            mockCheckId.checkId.mockReturnValueOnce(true).mockReturnValueOnce(false);

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId, challengeId: 'invalid-id', title: 'Update' }
            });
            const mockRes = testUtils.createMockResponse();

            await updateChallenge(mockReq as any, mockRes as any);

            expect(mockCheckId.checkId).toHaveBeenCalledTimes(2);
            expect(mockCheckId.checkId).toHaveBeenNthCalledWith(1, { id: adventureId, res: mockRes });
            expect(mockCheckId.checkId).toHaveBeenNthCalledWith(2, { id: 'invalid-id', res: mockRes });
            expect(mockAdventure.findById).toHaveBeenCalledTimes(1);
            expect(mockAdventure.findById).toHaveBeenCalledWith(adventureId);
        });

        it('should return 404 if adventure not found', async () => {
            // Reset the mock to ensure clean state after previous tests that used mockReturnValueOnce
            mockCheckId.checkId.mockReset();
            mockCheckId.checkId.mockReturnValue(true);
            mockAdventure.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId, challengeId, title: 'Update' }
            });
            const mockRes = testUtils.createMockResponse();

            await updateChallenge(mockReq as any, mockRes as any);

            expect(mockAdventure.findById).toHaveBeenCalledWith(adventureId);
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Adventure not found'
            });
        });

        it('should return 404 if challenge not found', async () => {
            const mockAdventureData = testUtils.createMockAdventureWithChallenges([]);
            mockAdventureData.challenges.find = jest.fn().mockReturnValue(undefined);
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId, challengeId, title: 'Update' }
            });
            const mockRes = testUtils.createMockResponse();

            await updateChallenge(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Challenge not found'
            });
        });

        it('should handle database save errors', async () => {
            const targetChallenge = {
                _id: challengeId,
                title: 'Test Challenge',
                toString: jest.fn(() => challengeId)
            };

            const mockAdventureData = testUtils.createMockAdventureWithChallenges([targetChallenge]);
            mockAdventureData.challenges.find = jest.fn().mockReturnValue(targetChallenge);
            mockAdventureData.save = jest.fn().mockRejectedValue(new Error('Save failed'));
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId, challengeId, title: 'Update' }
            });
            const mockRes = testUtils.createMockResponse();

            await updateChallenge(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'An unknown error occurred while updating challenge.'
            });
        });
    });

    // 5. test deleteChallenge API
    describe('deleteChallenge', () => {
        const adventureId = testUtils.ids.adventure;
        const challengeId = testUtils.ids.challenge;

        it('should delete challenge successfully', async () => {
            const challengeToDelete = {
                _id: challengeId,
                title: 'Challenge to Delete',
                toString: jest.fn(() => challengeId)
            };

            const mockAdventureData = testUtils.createMockAdventureWithChallenges([challengeToDelete]);
            mockAdventureData.challenges.findIndex = jest.fn().mockReturnValue(0);
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId, challengeId }
            });
            const mockRes = testUtils.createMockResponse();

            await deleteChallenge(mockReq as any, mockRes as any);

            expect(mockAdventure.findById).toHaveBeenCalledWith(adventureId);
            expect(mockAdventureData.challenges.findIndex).toHaveBeenCalledWith(expect.any(Function));
            expect(mockAdventureData.challenges.splice).toHaveBeenCalledWith(0, 1);
            expect(mockAdventureData.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Challenge deleted successfully',
                adventure: mockAdventureData
            });
        });

        it('should return early if adventureId checkId fails', async () => {
            mockCheckId.checkId.mockReturnValueOnce(false).mockReturnValueOnce(true);

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId: 'invalid-id', challengeId }
            });
            const mockRes = testUtils.createMockResponse();

            await deleteChallenge(mockReq as any, mockRes as any);

            expect(mockAdventure.findById).not.toHaveBeenCalled();
        });

        it('should return early if adventureId checkId fails', async () => {
            mockCheckId.checkId.mockReturnValueOnce(false).mockReturnValueOnce(true);

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId: 'invalid-id', challengeId }
            });
            const mockRes = testUtils.createMockResponse();

            await deleteChallenge(mockReq as any, mockRes as any);

            expect(mockAdventure.findById).not.toHaveBeenCalled();
        });

        it('should return 404 if adventure not found', async () => {
            mockAdventure.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId, challengeId }
            });
            const mockRes = testUtils.createMockResponse();

            await deleteChallenge(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Adventure not found'
            });
        });

        it('should return 404 if challenge not found for deletion', async () => {
            const mockAdventureData = testUtils.createMockAdventureWithChallenges([]);
            mockAdventureData.challenges.findIndex = jest.fn().mockReturnValue(-1);
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId, challengeId }
            });
            const mockRes = testUtils.createMockResponse();

            await deleteChallenge(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Challenge not found'
            });
        });

        it('should handle database save errors', async () => {
            const mockAdventureData = testUtils.createMockAdventureWithChallenges([]);
            mockAdventureData.challenges.findIndex = jest.fn().mockReturnValue(0);
            mockAdventureData.save = jest.fn().mockRejectedValue(new Error('Save failed'));
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId, challengeId }
            });
            const mockRes = testUtils.createMockResponse();

            await deleteChallenge(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Failed to delete. An unknown error occurred.'
            });
        });

        it('should delete the correct challenge from multiple challenges', async () => {
            const challenge1 = {
                _id: 'challenge1',
                title: 'Challenge 1',
                toString: jest.fn(() => 'challenge1')
            };
            const challenge2 = {
                _id: challengeId,
                title: 'Challenge 2',
                toString: jest.fn(() => challengeId)
            };
            const challenge3 = {
                _id: 'challenge3',
                title: 'Challenge 3',
                toString: jest.fn(() => 'challenge3')
            };

            const mockAdventureData = testUtils.createMockAdventureWithChallenges([challenge1, challenge2, challenge3]);
            mockAdventureData.challenges.findIndex = jest.fn().mockReturnValue(1); // Index of challenge2
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({ 
                body: { adventureId, challengeId }
            });
            const mockRes = testUtils.createMockResponse();

            await deleteChallenge(mockReq as any, mockRes as any);

            expect(mockAdventureData.challenges.splice).toHaveBeenCalledWith(1, 1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });
});