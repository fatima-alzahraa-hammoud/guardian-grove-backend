import { createAdventure, getAllAdventures } from '../../src/controllers/adventure.controller';
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
});