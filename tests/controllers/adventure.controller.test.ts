import { Adventure } from '../../src/models/adventure.model';
import * as checkId from '../../src/utils/checkId';

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
});