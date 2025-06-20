// Global test setup for Guardian Grove project
import { config } from 'dotenv';

// Load test environment variables from .env.test
config({ path: '.env.test' });

// Set test timeout (10 seconds for database operations)
jest.setTimeout(10000);

// Global cleanup after each test
afterEach(() => {
    jest.clearAllMocks();
});

// Set required environment variables for your app
process.env.NODE_ENV = 'test';

// Ensure these are set even if .env.test is missing some values
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-jwt-secret-fallback';
}
if (!process.env.EMAIL_USERNAME) {
    process.env.EMAIL_USERNAME = 'test@guardiangrove.com';
}
if (!process.env.EMAIL_PASSWORD) {
    process.env.EMAIL_PASSWORD = 'test-password';
}
if (!process.env.MONGO_URI) {
    process.env.MONGO_URI = 'mongodb://localhost:27017/guardian_grove_test';
}
if (!process.env.PORT) {
    process.env.PORT = '3001';
}

// Export test utilities
export const testUtils = {
    // Create mock Express request object
    createMockRequest: (overrides = {}) => ({
        body: {},
        params: {},
        query: {},
        headers: {},
        user: null,
        ...overrides,
    }),
    
    // Create mock Express response object with all methods your controllers use
    createMockResponse: () => {
        const res: any = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        res.send = jest.fn().mockReturnValue(res);
        res.cookie = jest.fn().mockReturnValue(res);
        res.clearCookie = jest.fn().mockReturnValue(res);
        res.redirect = jest.fn().mockReturnValue(res);
        return res;
    },

    // Create mock user based on your actual User model structure
    createMockUser: (overrides = {}) => ({
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
        isTempPassword: false,
        passwordChangedAt: new Date('2024-01-01'),
        password: 'hashedPassword123',
        birthday: new Date('1990-01-01'),
        dailyMessage: 'You are shining💫!',
        gender: 'male',
        role: 'parent',
        avatar: '/assets/images/avatars/parent/avatar1.png',
        interests: ['reading', 'sports'],
        memberSince: new Date('2024-01-01'),
        currentLocation: 'not specified',
        stars: 100,
        coins: 50,
        nbOfTasksCompleted: 5,
        rankInFamily: 1,
        familyId: '507f1f77bcf86cd799439012',
        // Arrays based on your schema
        adventures: [],
        achievements: [],
        purchasedItems: [],
        notifications: [],
        notes: [],
        goals: [],
        books: [],
        drawings: [],
        colorings: [],
        personalStories: [],
        // Mock Mongoose methods
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn(),
        equals: jest.fn((id: any) => id === '507f1f77bcf86cd799439011'),
        ...overrides
    }),

    // Create mock family based on your Family model
    createMockFamily: (overrides = {}) => ({
        _id: '507f1f77bcf86cd799439012',
        email: 'family@example.com',
        members: [],
        totalStars: 500,
        familyName: 'Test Family',
        // Mock Mongoose methods
        save: jest.fn().mockResolvedValue(true),
        ...overrides
    }),

    // Create mock adventure based on your Adventure model
    createMockAdventure: (overrides = {}) => ({
        _id: '507f1f77bcf86cd799439015',
        title: 'Test Adventure',
        description: 'A test adventure',
        challenges: [
        {
            _id: '507f1f77bcf86cd799439016',
            title: 'Test Challenge',
            description: 'A test challenge',
            starsReward: 10,
            coinsReward: 5,
            equals: jest.fn((id: any) => id === '507f1f77bcf86cd799439016')
        }
        ],
        starsReward: 100,
        coinsReward: 50,
        difficulty: 'easy',
        category: 'learning',
        ...overrides
    }),

    // Valid MongoDB ObjectId for testing (24 character hex string)
    validObjectId: '507f1f77bcf86cd799439011',
    
    // Invalid ObjectId for testing error cases
    invalidObjectId: 'invalid-id-format',

    // Helper functions for nested schema objects
    createMockAdventureProgress: (overrides = {}) => ({
        adventureId: '507f1f77bcf86cd799439015',
        challenges: [],
        isAdventureCompleted: false,
        status: 'in-progress',
        progress: 0,
        starsReward: 10,
        coinsReward: 5,
        ...overrides
    }),

    createMockChallengeProgress: (overrides = {}) => ({
        challengeId: '507f1f77bcf86cd799439016',
        isCompleted: false,
        completedAt: undefined,
        ...overrides
    }),

    createMockPurchasedItem: (overrides = {}) => ({
        itemId: '507f1f77bcf86cd799439017',
        purchasedAt: new Date(),
        ...overrides
    }),

    createMockNote: (overrides = {}) => ({
        _id: '507f1f77bcf86cd799439018',
        title: 'Test Note',
        content: 'This is a test note content',
        type: 'personal',
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    }),

    createMockNotification: (overrides = {}) => ({
        _id: '507f1f77bcf86cd799439019',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'info',
        isRead: false,
        createdAt: new Date(),
        ...overrides
    })
};