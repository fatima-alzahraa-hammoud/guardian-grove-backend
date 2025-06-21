import { testUtils } from '../setup';
import { buyItem, createItem, deleteItem, getStoreItems, updateItem } from '../../src/controllers/store.controller';
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

    // 2. test createItem API
    describe('createItem', () => {
        const validItemData = {
            name: 'New Avatar',
            description: 'A cool new avatar',
            type: 'avatar',
            price: 100,
            image: '/assets/images/avatars/new-avatar.png'
        };

        it('should create store item successfully', async () => {
            const mockNewItem = testUtils.createMockStoreItem(validItemData);
            mockStoreItem.prototype.save = jest.fn().mockResolvedValue(mockNewItem);
            
            // Mock the constructor
            (mockStoreItem as any).mockImplementation(() => ({
                ...mockNewItem,
                save: jest.fn().mockResolvedValue(mockNewItem)
            }));

            const mockReq = testUtils.createMockRequest({ body: validItemData });
            const mockRes = testUtils.createMockResponse();

            await createItem(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'StoreItem created successfully',
                StoreItem: expect.objectContaining({
                    name: 'New Avatar',
                    type: 'avatar',
                    price: 100
                })
            });
        });

        it('should use default price when not provided', async () => {
            const itemDataWithoutPrice = { ...validItemData };
            delete (itemDataWithoutPrice as any).price;

            const mockNewItem = testUtils.createMockStoreItem({ ...itemDataWithoutPrice, price: 5 });
            
            (mockStoreItem as any).mockImplementation(() => ({
                ...mockNewItem,
                save: jest.fn().mockResolvedValue(mockNewItem)
            }));

            const mockReq = testUtils.createMockRequest({ body: itemDataWithoutPrice });
            const mockRes = testUtils.createMockResponse();

            await createItem(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        it('should return 400 if required fields are missing', async () => {
            const incompleteData = { name: 'Incomplete Item' }; // Missing required fields

            const mockReq = testUtils.createMockRequest({ body: incompleteData });
            const mockRes = testUtils.createMockResponse();

            await createItem(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'All required fields must be filled.' 
            });
        });

        it('should return 400 if name is missing', async () => {
            const dataWithoutName = { ...validItemData };
            delete (dataWithoutName as any).name;

            const mockReq = testUtils.createMockRequest({ body: dataWithoutName });
            const mockRes = testUtils.createMockResponse();

            await createItem(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'All required fields must be filled.' 
            });
        });

        it('should return 400 if type is missing', async () => {
            const dataWithoutType = { ...validItemData };
            delete (dataWithoutType as any).type;

            const mockReq = testUtils.createMockRequest({ body: dataWithoutType });
            const mockRes = testUtils.createMockResponse();

            await createItem(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'All required fields must be filled.' 
            });
        });

        it('should return 400 if image is missing', async () => {
            const dataWithoutImage = { ...validItemData };
            delete (dataWithoutImage as any).image;

            const mockReq = testUtils.createMockRequest({ body: dataWithoutImage });
            const mockRes = testUtils.createMockResponse();

            await createItem(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'All required fields must be filled.' 
            });
        });

        it('should handle save errors', async () => {
            (mockStoreItem as any).mockImplementation(() => ({
                save: jest.fn().mockRejectedValue(new Error('Save failed'))
            }));

            const mockReq = testUtils.createMockRequest({ body: validItemData });
            const mockRes = testUtils.createMockResponse();

            await createItem(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'An unknown error occurred.' 
            });
        });
    });

    // 3. test deleteItem API
    describe('deleteItem', () => {
        const itemId = testUtils.ids.storeItem || '507f1f77bcf86cd799439060';

        it('should delete item successfully', async () => {
            const mockDeletedItem = testUtils.createMockStoreItem();
            
            mockStoreItem.findByIdAndDelete.mockResolvedValue(mockDeletedItem as any);
            mockUser.updateMany.mockResolvedValue({ modifiedCount: 2 } as any);

            const mockReq = testUtils.createMockRequest({ params: { itemId } });
            const mockRes = testUtils.createMockResponse();

            await deleteItem(mockReq as any, mockRes as any);

            expect(mockStoreItem.findByIdAndDelete).toHaveBeenCalledWith(itemId);
            expect(mockUser.updateMany).toHaveBeenCalledWith(
                { 'purchasedItems.itemId': itemId },
                { $pull: { purchasedItems: { itemId } } }
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Item deleted successfully'
            });
        });

        it('should return 404 if item not found', async () => {
            mockStoreItem.findByIdAndDelete.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ params: { itemId } });
            const mockRes = testUtils.createMockResponse();

            await deleteItem(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Item not found' 
            });
        });

        it('should return early if checkId fails', async () => {
            mockCheckId.checkId.mockReturnValue(false);

            const mockReq = testUtils.createMockRequest({ params: { itemId: 'invalid-id' } });
            const mockRes = testUtils.createMockResponse();

            await deleteItem(mockReq as any, mockRes as any);

            expect(mockStoreItem.findByIdAndDelete).not.toHaveBeenCalled();
        });

        it('should handle database errors', async () => {
            mockStoreItem.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

            const mockReq = testUtils.createMockRequest({ params: { itemId } });
            const mockRes = testUtils.createMockResponse();

            await deleteItem(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Failed to delete. An unknown error occurred.' 
            });
        });
    });

    // 4. test updateItem API
    describe('updateItem', () => {
        const itemId = testUtils.ids.storeItem || '507f1f77bcf86cd799439060';
        const updateData = {
            itemId,
            name: 'Updated Item Name',
            price: 75,
            description: 'Updated description'
        };

        it('should update item successfully', async () => {
            const mockUpdatedItem = testUtils.createMockStoreItem({ 
                name: 'Updated Item Name',
                price: 75,
                description: 'Updated description'
            });
            
            mockStoreItem.findByIdAndUpdate.mockResolvedValue(mockUpdatedItem as any);

            const mockReq = testUtils.createMockRequest({ body: updateData });
            const mockRes = testUtils.createMockResponse();

            await updateItem(mockReq as any, mockRes as any);

            expect(mockStoreItem.findByIdAndUpdate).toHaveBeenCalledWith(
                itemId,
                updateData,
                { new: true, runValidators: true }
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Item Updated Successfully',
                item: mockUpdatedItem
            });
        });

        it('should return 400 if no update data provided', async () => {
            const onlyItemId = { itemId };

            const mockReq = testUtils.createMockRequest({ body: onlyItemId });
            const mockRes = testUtils.createMockResponse();

            await updateItem(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'No other data provided to update' 
            });
        });

        it('should return 404 if item not found', async () => {
            mockStoreItem.findByIdAndUpdate.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ body: updateData });
            const mockRes = testUtils.createMockResponse();

            await updateItem(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Item not found' 
            });
        });

        it('should return early if checkId fails', async () => {
            mockCheckId.checkId.mockReturnValue(false);

            const mockReq = testUtils.createMockRequest({ body: { itemId: 'invalid-id' } });
            const mockRes = testUtils.createMockResponse();

            await updateItem(mockReq as any, mockRes as any);

            expect(mockStoreItem.findByIdAndUpdate).not.toHaveBeenCalled();
        });

        it('should handle partial updates', async () => {
            const partialUpdateData = {
                itemId,
                name: 'Only Name Updated'
            };

            const mockUpdatedItem = testUtils.createMockStoreItem({ name: 'Only Name Updated' });
            mockStoreItem.findByIdAndUpdate.mockResolvedValue(mockUpdatedItem as any);

            const mockReq = testUtils.createMockRequest({ body: partialUpdateData });
            const mockRes = testUtils.createMockResponse();

            await updateItem(mockReq as any, mockRes as any);

            expect(mockStoreItem.findByIdAndUpdate).toHaveBeenCalledWith(
                itemId,
                partialUpdateData,
                { new: true, runValidators: true }
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should handle database errors', async () => {
            mockStoreItem.findByIdAndUpdate.mockRejectedValue(new Error('Update failed'));

            const mockReq = testUtils.createMockRequest({ body: updateData });
            const mockRes = testUtils.createMockResponse();

            await updateItem(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Failed to update. An unknown error occurred.' 
            });
        });
    });

    // 5. test buyItem API
    describe('buyItem', () => {
        const itemId = testUtils.ids.storeItem || '507f1f77bcf86cd799439060';
        const buyItemData = { itemId };

        it('should buy item successfully', async () => {
            const mockItem = testUtils.createMockStoreItem({ price: 50 });
            const mockUserData = testUtils.createMockUser({ 
                coins: 100,
                purchasedItems: [],
                save: jest.fn().mockResolvedValue(true)
            });
            
            mockStoreItem.findById.mockResolvedValue(mockItem as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: buyItemData 
            });
            const mockRes = testUtils.createMockResponse();

            await buyItem(mockReq as any, mockRes as any);

            expect(mockUserData.coins).toBe(50); // 100 - 50
            expect(mockUserData.purchasedItems).toHaveLength(1);
            expect(mockUserData.purchasedItems[0]).toEqual({
                itemId: mockItem._id,
                purchasedAt: expect.any(Date)
            });
            expect(mockUserData.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Item purchased successfully',
                item: mockItem
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ 
                user: null,
                body: buyItemData 
            });
            const mockRes = testUtils.createMockResponse();

            await buyItem(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 404 if item not found', async () => {
            mockStoreItem.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser(),
                body: buyItemData 
            });
            const mockRes = testUtils.createMockResponse();

            await buyItem(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Item not found' });
        });

        it('should return 400 if item already purchased', async () => {
            const mockItem = testUtils.createMockStoreItem();
            const mockUserData = testUtils.createMockUser({ 
                purchasedItems: [{ 
                    itemId: mockItem._id, 
                    purchasedAt: new Date() 
                }]
            });
            
            mockStoreItem.findById.mockResolvedValue(mockItem as any);
            
            // Mock the some method
            mockUserData.purchasedItems.some = jest.fn().mockReturnValue(true);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: buyItemData 
            });
            const mockRes = testUtils.createMockResponse();

            await buyItem(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Item already purchased' });
        });

        it('should return 400 if user has insufficient coins', async () => {
            const mockItem = testUtils.createMockStoreItem({ price: 100 });
            const mockUserData = testUtils.createMockUser({ 
                coins: 50, // Less than item price
                purchasedItems: []
            });
            
            mockStoreItem.findById.mockResolvedValue(mockItem as any);
            
            // Mock the some method to return false (not already purchased)
            mockUserData.purchasedItems.some = jest.fn().mockReturnValue(false);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: buyItemData 
            });
            const mockRes = testUtils.createMockResponse();

            await buyItem(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Insufficient coins' });
        });

        it('should handle exact coin amount', async () => {
            const mockItem = testUtils.createMockStoreItem({ price: 100 });
            const mockUserData = testUtils.createMockUser({ 
                coins: 100, // Exactly the item price
                purchasedItems: [],
                save: jest.fn().mockResolvedValue(true)
            });
            
            mockStoreItem.findById.mockResolvedValue(mockItem as any);
            mockUserData.purchasedItems.some = jest.fn().mockReturnValue(false);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: buyItemData 
            });
            const mockRes = testUtils.createMockResponse();

            await buyItem(mockReq as any, mockRes as any);

            expect(mockUserData.coins).toBe(0); // 100 - 100
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should handle database save errors', async () => {
            const mockItem = testUtils.createMockStoreItem({ price: 50 });
            const mockUserData = testUtils.createMockUser({ 
                coins: 100,
                purchasedItems: [],
                save: jest.fn().mockRejectedValue(new Error('Save failed'))
            });
            
            mockStoreItem.findById.mockResolvedValue(mockItem as any);
            mockUserData.purchasedItems.some = jest.fn().mockReturnValue(false);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: buyItemData 
            });
            const mockRes = testUtils.createMockResponse();

            await buyItem(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Purchase failed' });
        });

        it('should handle item lookup errors', async () => {
            mockStoreItem.findById.mockRejectedValue(new Error('Database error'));

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser(),
                body: buyItemData 
            });
            const mockRes = testUtils.createMockResponse();

            await buyItem(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Purchase failed' });
        });
    });
});