import { testUtils } from '../setup';
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
});