import { createAdventure, getAdventureById, getAllAdventures, updateAdventure } from '../../src/controllers/adventure.controller';
import { Adventure } from '../../src/models/adventure.model';
import * as checkId from '../../src/utils/checkId';
import { testUtils } from '../setup';

// Mock all dependencies
jest.mock('../../src/models/adventure.model');
jest.mock('../../src/utils/checkId');

const mockAdventure = Adventure as jest.Mocked<typeof Adventure>;
const mockCheckId = checkId as jest.Mocked<typeof checkId>;

describe('Adventure Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup Adventure model methods
        mockAdventure.find = jest.fn();
        mockAdventure.findById = jest.fn();
        mockAdventure.findByIdAndUpdate = jest.fn();
        mockAdventure.findByIdAndDelete = jest.fn();
        
        // Setup utility mocks
        mockCheckId.checkId.mockReturnValue(true);
    });

    // 1. test createAdventure API
    describe('createAdventure', () => {
        const validAdventureData = {
            title: 'Space Explorer',
            description: 'Explore the mysteries of space',
            starsReward: 50,
            coinsReward: 25
        };

        it('should create adventure successfully with all fields', async () => {
            const mockCreatedAdventure = testUtils.createMockAdventure(validAdventureData);
            
            // Mock the Adventure constructor and save method
            const mockSave = jest.fn().mockResolvedValue(mockCreatedAdventure);
            (Adventure as any).mockImplementation(() => ({
                ...mockCreatedAdventure,
                save: mockSave
            }));

            const mockReq = testUtils.createMockRequest({ body: validAdventureData });
            const mockRes = testUtils.createMockResponse();

            await createAdventure(mockReq as any, mockRes as any);

            expect(mockSave).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Adventure created successfully",
                adventure: expect.objectContaining({
                    title: validAdventureData.title,
                    description: validAdventureData.description,
                    starsReward: validAdventureData.starsReward,
                    coinsReward: validAdventureData.coinsReward
                })
            });
        });

        it('should create adventure with default rewards when not provided', async () => {
            const minimalData = {
                title: 'Simple Adventure',
                description: 'A simple adventure'
            };
            const mockCreatedAdventure = testUtils.createMockAdventure({
                ...minimalData,
                starsReward: 10,
                coinsReward: 5
            });
            
            const mockSave = jest.fn().mockResolvedValue(mockCreatedAdventure);
            (Adventure as any).mockImplementation(() => ({
                ...mockCreatedAdventure,
                save: mockSave
            }));

            const mockReq = testUtils.createMockRequest({ body: minimalData });
            const mockRes = testUtils.createMockResponse();

            await createAdventure(mockReq as any, mockRes as any);

            expect(mockSave).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Adventure created successfully",
                adventure: expect.objectContaining({
                    title: minimalData.title,
                    description: minimalData.description,
                    starsReward: 10,
                    coinsReward: 5
                })
            });
        });

        it('should return 400 if title is missing', async () => {
            const incompleteData = {
                description: 'Adventure without title'
            };

            const mockReq = testUtils.createMockRequest({ body: incompleteData });
            const mockRes = testUtils.createMockResponse();

            await createAdventure(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'All required fields must be filled.'
            });
        });

        it('should return 400 if description is missing', async () => {
            const incompleteData = {
                title: 'Adventure without description'
            };

            const mockReq = testUtils.createMockRequest({ body: incompleteData });
            const mockRes = testUtils.createMockResponse();

            await createAdventure(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'All required fields must be filled.'
            });
        });

        it('should return 400 if both title and description are missing', async () => {
            const emptyData = {};

            const mockReq = testUtils.createMockRequest({ body: emptyData });
            const mockRes = testUtils.createMockResponse();

            await createAdventure(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'All required fields must be filled.'
            });
        });

        it('should handle database save errors', async () => {
            const mockSave = jest.fn().mockRejectedValue(new Error('Database save failed'));
            (Adventure as any).mockImplementation(() => ({
                save: mockSave
            }));

            const mockReq = testUtils.createMockRequest({ body: validAdventureData });
            const mockRes = testUtils.createMockResponse();

            await createAdventure(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'An unknown error occurred.'
            });
        });

        it('should handle empty string title and description', async () => {
            const invalidData = {
                title: '',
                description: ''
            };

            const mockReq = testUtils.createMockRequest({ body: invalidData });
            const mockRes = testUtils.createMockResponse();

            await createAdventure(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'All required fields must be filled.'
            });
        });

        it('should handle whitespace-only title and description', async () => {
            const invalidData = {
                title: '   ',
                description: '   '
            };

            const mockReq = testUtils.createMockRequest({ body: invalidData });
            const mockRes = testUtils.createMockResponse();

            await createAdventure(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'All required fields must be filled.'
            });
        });

        it('should create adventure with zero rewards if explicitly provided', async () => {
            const zeroRewardData = {
                title: 'Free Adventure',
                description: 'An adventure with no rewards',
                starsReward: 0,
                coinsReward: 0
            };
            const mockCreatedAdventure = testUtils.createMockAdventure(zeroRewardData);
            
            const mockSave = jest.fn().mockResolvedValue(mockCreatedAdventure);
            (Adventure as any).mockImplementation(() => ({
                ...mockCreatedAdventure,
                save: mockSave
            }));

            const mockReq = testUtils.createMockRequest({ body: zeroRewardData });
            const mockRes = testUtils.createMockResponse();

            await createAdventure(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Adventure created successfully",
                adventure: expect.objectContaining({
                    starsReward: 0,
                    coinsReward: 0
                })
            });
        });
    });

    // 2. test getAllAdventures API
    describe('getAllAdventures', () => {
        it('should return all adventures successfully', async () => {
            const mockAdventures = [
                testUtils.createMockAdventure({ title: 'Adventure 1' }),
                testUtils.createMockAdventure({ 
                    _id: '507f1f77bcf86cd799439016',
                    title: 'Adventure 2' 
                })
            ];
            mockAdventure.find.mockResolvedValue(mockAdventures as any);

            const mockReq = testUtils.createMockRequest();
            const mockRes = testUtils.createMockResponse();

            await getAllAdventures(mockReq as any, mockRes as any);

            expect(mockAdventure.find).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Getting all adventures Successfully",
                adventures: mockAdventures
            });
        });

        it('should return 400 when no adventures found', async () => {
            mockAdventure.find.mockResolvedValue(null as any);

            const mockReq = testUtils.createMockRequest();
            const mockRes = testUtils.createMockResponse();

            await getAllAdventures(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'No adventures found'
            });
        });

        it('should return empty array when adventures exist but empty', async () => {
            mockAdventure.find.mockResolvedValue([] as any);

            const mockReq = testUtils.createMockRequest();
            const mockRes = testUtils.createMockResponse();

            await getAllAdventures(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Getting all adventures Successfully",
                adventures: []
            });
        });

        it('should handle database errors', async () => {
            mockAdventure.find.mockRejectedValue(new Error('Database connection failed'));

            const mockReq = testUtils.createMockRequest();
            const mockRes = testUtils.createMockResponse();

            await getAllAdventures(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'An unknown error occurred while getting all adventures.'
            });
        });
    });

    // 3. test getAdventureById API
    describe('getAdventureById', () => {
        it('should return adventure by ID successfully', async () => {
            const mockAdventureData = testUtils.createMockAdventure();
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({
                body: { adventureId: '507f1f77bcf86cd799439015' }
            });
            const mockRes = testUtils.createMockResponse();

            await getAdventureById(mockReq as any, mockRes as any);

            expect(mockCheckId.checkId).toHaveBeenCalledWith({
                id: '507f1f77bcf86cd799439015',
                res: mockRes
            });
            expect(mockAdventure.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439015');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockAdventureData);
        });

        it('should return early if checkId fails', async () => {
            mockCheckId.checkId.mockReturnValue(false);

            const mockReq = testUtils.createMockRequest({
                body: { adventureId: 'invalid-id' }
            });
            const mockRes = testUtils.createMockResponse();

            await getAdventureById(mockReq as any, mockRes as any);

            expect(mockCheckId.checkId).toHaveBeenCalledWith({
                id: 'invalid-id',
                res: mockRes
            });
            expect(mockAdventure.findById).not.toHaveBeenCalled();
        });

        it('should return 404 if adventure not found', async () => {
            mockAdventure.findById.mockResolvedValue(null as any);

            const mockReq = testUtils.createMockRequest({
                body: { adventureId: '507f1f77bcf86cd799439015' }
            });
            const mockRes = testUtils.createMockResponse();

            await getAdventureById(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Adventure not found'
            });
        });

        it('should handle database errors', async () => {
            mockAdventure.findById.mockRejectedValue(new Error('Database error'));

            const mockReq = testUtils.createMockRequest({
                body: { adventureId: '507f1f77bcf86cd799439015' }
            });
            const mockRes = testUtils.createMockResponse();

            await getAdventureById(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'An unknown error occurred while getting the adventure.'
            });
        });

        it('should handle missing adventureId in request body', async () => {
            const mockReq = testUtils.createMockRequest({
                body: {} // No adventureId
            });
            const mockRes = testUtils.createMockResponse();

            await getAdventureById(mockReq as any, mockRes as any);

            expect(mockCheckId.checkId).toHaveBeenCalledWith({
                id: undefined,
                res: mockRes
            });
        });
    });

    // 4. test updateAdventure API
    describe('updateAdventure', () => {
        it('should update adventure successfully', async () => {
            const updateData = {
                adventureId: '507f1f77bcf86cd799439015',
                title: 'Updated Adventure',
                description: 'Updated description',
                starsReward: 75
            };
            const mockUpdatedAdventure = testUtils.createMockAdventure(updateData);
            mockAdventure.findByIdAndUpdate.mockResolvedValue(mockUpdatedAdventure as any);

            const mockReq = testUtils.createMockRequest({ body: updateData });
            const mockRes = testUtils.createMockResponse();

            await updateAdventure(mockReq as any, mockRes as any);

            expect(mockCheckId.checkId).toHaveBeenCalledWith({
                id: '507f1f77bcf86cd799439015',
                res: mockRes
            });
            expect(mockAdventure.findByIdAndUpdate).toHaveBeenCalledWith(
                '507f1f77bcf86cd799439015',
                updateData,
                { new: true, runValidators: true }
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Adventure Updated Successfully",
                adventure: mockUpdatedAdventure
            });
        });

        it('should return early if checkId fails', async () => {
            mockCheckId.checkId.mockReturnValue(false);

            const mockReq = testUtils.createMockRequest({
                body: { adventureId: 'invalid-id', title: 'New Title' }
            });
            const mockRes = testUtils.createMockResponse();

            await updateAdventure(mockReq as any, mockRes as any);

            expect(mockCheckId.checkId).toHaveBeenCalledWith({
                id: 'invalid-id',
                res: mockRes
            });
            expect(mockAdventure.findByIdAndUpdate).not.toHaveBeenCalled();
        });

        it('should return 400 if no update data provided', async () => {
            const mockReq = testUtils.createMockRequest({
                body: { adventureId: '507f1f77bcf86cd799439015' } // Only adventureId
            });
            const mockRes = testUtils.createMockResponse();

            await updateAdventure(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'No other data provided to update'
            });
        });

        it('should return 404 if adventure not found', async () => {
            mockAdventure.findByIdAndUpdate.mockResolvedValue(null as any);

            const mockReq = testUtils.createMockRequest({
                body: {
                    adventureId: '507f1f77bcf86cd799439015',
                    title: 'Updated Title'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updateAdventure(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Adventure not found'
            });
        });

        it('should handle database errors', async () => {
            mockAdventure.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));

            const mockReq = testUtils.createMockRequest({
                body: {
                    adventureId: '507f1f77bcf86cd799439015',
                    title: 'Updated Title'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updateAdventure(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Failed to update. An unknown error occurred.'
            });
        });

        it('should update adventure with partial data', async () => {
            const partialUpdateData = {
                adventureId: '507f1f77bcf86cd799439015',
                starsReward: 100
            };
            const mockUpdatedAdventure = testUtils.createMockAdventure({
                starsReward: 100
            });
            mockAdventure.findByIdAndUpdate.mockResolvedValue(mockUpdatedAdventure as any);

            const mockReq = testUtils.createMockRequest({ body: partialUpdateData });
            const mockRes = testUtils.createMockResponse();

            await updateAdventure(mockReq as any, mockRes as any);

            expect(mockAdventure.findByIdAndUpdate).toHaveBeenCalledWith(
                '507f1f77bcf86cd799439015',
                partialUpdateData,
                { new: true, runValidators: true }
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should handle updating with zero values', async () => {
            const zeroUpdateData = {
                adventureId: '507f1f77bcf86cd799439015',
                starsReward: 0,
                coinsReward: 0
            };
            const mockUpdatedAdventure = testUtils.createMockAdventure(zeroUpdateData);
            mockAdventure.findByIdAndUpdate.mockResolvedValue(mockUpdatedAdventure as any);

            const mockReq = testUtils.createMockRequest({ body: zeroUpdateData });
            const mockRes = testUtils.createMockResponse();

            await updateAdventure(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Adventure Updated Successfully",
                adventure: mockUpdatedAdventure
            });
        });
    });
});