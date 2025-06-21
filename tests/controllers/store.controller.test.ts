import { testUtils } from '../setup';
import { getStoreItems } from '../../src/controllers/store.controller';
import { StoreItem } from '../../src/models/storeItem.model';
import { User } from '../../src/models/user.model';
import * as checkId from '../../src/utils/checkId';

// Mock all dependencies
jest.mock('../../src/models/storeItem.model');
jest.mock('../../src/models/user.model');
jest.mock('../../src/utils/checkId');

const mockStoreItem = StoreItem as jest.Mocked<typeof StoreItem>;
const mockUser = User as jest.Mocked<typeof User>;
const mockCheckId = checkId as jest.Mocked<typeof checkId>;

describe('Store Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup model methods
        mockStoreItem.find = jest.fn();
        mockStoreItem.findById = jest.fn();
        mockStoreItem.findByIdAndDelete = jest.fn();
        mockStoreItem.findByIdAndUpdate = jest.fn();
        mockUser.updateMany = jest.fn();
        
        // Setup utility mocks
        mockCheckId.checkId.mockReturnValue(true);
    });

    // 1. test getStoreItems API
    describe('getStoreItems', () => {
        it('should get all store items when no category specified', async () => {
            const mockItems = [
                testUtils.createMockStoreItem({ type: 'avatar' }),
                testUtils.createMockStoreItem({ type: 'background', name: 'Background Item' })
            ];
            
            mockStoreItem.find.mockResolvedValue(mockItems as any);

            const mockReq = testUtils.createMockRequest({ query: {} });
            const mockRes = testUtils.createMockResponse();

            await getStoreItems(mockReq as any, mockRes as any);

            expect(mockStoreItem.find).toHaveBeenCalledWith({});
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'get items successfully',
                items: mockItems
            });
        });

        it('should get all store items when category is "All"', async () => {
            const mockItems = [testUtils.createMockStoreItem()];
            
            mockStoreItem.find.mockResolvedValue(mockItems as any);

            const mockReq = testUtils.createMockRequest({ query: { category: 'All' } });
            const mockRes = testUtils.createMockResponse();

            await getStoreItems(mockReq as any, mockRes as any);

            expect(mockStoreItem.find).toHaveBeenCalledWith({});
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should get store items by specific category', async () => {
            const mockItems = [testUtils.createMockStoreItem({ type: 'avatar' })];
            
            mockStoreItem.find.mockResolvedValue(mockItems as any);

            const mockReq = testUtils.createMockRequest({ query: { category: 'avatar' } });
            const mockRes = testUtils.createMockResponse();

            await getStoreItems(mockReq as any, mockRes as any);

            expect(mockStoreItem.find).toHaveBeenCalledWith({ type: 'avatar' });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'get items successfully',
                items: mockItems
            });
        });

        it('should return 400 if no items found for category', async () => {
            mockStoreItem.find.mockResolvedValue([]);

            const mockReq = testUtils.createMockRequest({ query: { category: 'nonexistent' } });
            const mockRes = testUtils.createMockResponse();

            await getStoreItems(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'No items found for this category' 
            });
        });

        it('should handle database errors', async () => {
            mockStoreItem.find.mockRejectedValue(new Error('Database error'));

            const mockReq = testUtils.createMockRequest({ query: {} });
            const mockRes = testUtils.createMockResponse();

            await getStoreItems(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Error fetching store items' 
            });
        });
    });
});