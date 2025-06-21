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

    // Create mock family based on your complete Family model schema
    createMockFamily: (overrides = {}) => {
        // Create default arrays with mock methods
        const defaultGoals = Object.assign([], {
            find: jest.fn(),
            filter: jest.fn(),
            push: jest.fn(),
            splice: jest.fn(),
            findIndex: jest.fn(),
            flatMap: jest.fn(),
            every: jest.fn(),
            map: jest.fn()
        });

        const defaultMembers = Object.assign([
            {
                _id: '507f1f77bcf86cd799439030',
                name: 'John Doe',
                role: 'parent',
                gender: 'male',
                avatar: '/assets/images/avatars/parent/avatar1.png'
            },
            {
                _id: '507f1f77bcf86cd799439031', 
                name: 'Jane Doe',
                role: 'child',
                gender: 'female',
                avatar: '/assets/images/avatars/child/avatar2.png'
            }
        ], {
            map: jest.fn(),
            find: jest.fn(),
            filter: jest.fn(),
            push: jest.fn(),
            splice: jest.fn()
        });

        const defaultAchievements = Object.assign([], {
            push: jest.fn(),
            find: jest.fn(),
            filter: jest.fn()
        });

        const defaultNotifications = Object.assign([], {
            push: jest.fn(),
            find: jest.fn(),
            filter: jest.fn()
        });

        const defaultSharedStories = Object.assign([], {
            push: jest.fn(),
            find: jest.fn(),
            filter: jest.fn()
        });

        return {
            _id: '507f1f77bcf86cd799439012',
            familyName: 'Test Family',
            members: defaultMembers,
            email: 'family@example.com',
            createdAt: new Date('2024-01-01'),
            totalStars: 500,
            tasks: 10,
            notifications: defaultNotifications,
            goals: defaultGoals,
            achievements: defaultAchievements,
            stars: {
                daily: 50,
                weekly: 150,
                monthly: 300,
                yearly: 500
            },
            taskCounts: {
                daily: 2,
                weekly: 5,
                monthly: 8,
                yearly: 10
            },
            familyAvatar: '/assets/images/family-avatars/default.png',
            sharedStories: defaultSharedStories,
            // Mock Mongoose methods
            save: jest.fn().mockResolvedValue(true),
            toJSON: jest.fn(),
            toObject: jest.fn(),
            equals: jest.fn((id: any) => id === '507f1f77bcf86cd799439012'),
            ...overrides
        };
    },

    // Create mock goal based on your goal schema
    createMockGoal: (overrides = {}) => ({
        _id: '507f1f77bcf86cd799439020',
        title: 'Test Goal',
        description: 'A test family goal',
        type: 'weekly',
        dueDate: new Date('2024-12-31'),
        isCompleted: false,
        progress: 0,
        nbOfTasksCompleted: 0, // Add this property
        createdAt: new Date('2024-01-01'),
        completedAt: undefined, // Add this property
        rewards: {
            stars: 50,
            coins: 25,
            achievementName: '',
            achievementId: null
        },
        tasks: [],
        // Mock methods
        toString: jest.fn(() => '507f1f77bcf86cd799439020'),
        ...overrides
    }),

    // Create mock task based on your task interface
    createMockTask: (overrides = {}) => ({
        _id: '507f1f77bcf86cd799439025',
        title: 'Test Task',
        description: 'A test family task',
        type: 'family',
        isCompleted: false,
        rewards: {
            stars: 10,
            coins: 5
        },
        createdAt: new Date('2024-01-15'),
        // Mock methods
        toString: jest.fn(() => '507f1f77bcf86cd799439025'),
        ...overrides
    }),

    // Create mock achievement based on your Achievement model
    createMockAchievement: (overrides = {}) => ({
        _id: '507f1f77bcf86cd799439040',
        title: 'Test Achievement',
        description: 'A test achievement',
        category: 'goals',
        difficulty: 'easy',
        starsReward: 100,
        coinsReward: 50,
        icon: '/assets/icons/achievement.png',
        // Mock methods
        toString: jest.fn(() => '507f1f77bcf86cd799439040'),
        ...overrides
    }),

    // Create mock unlocked achievement
    createMockUnlockedAchievement: (overrides = {}) => ({
        achievementId: '507f1f77bcf86cd799439040',
        unlockedAt: new Date('2024-01-15'),
        ...overrides
    }),

    // Create mock notification
    createMockNotification: (overrides = {}) => ({
        _id: '507f1f77bcf86cd799439050',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'info',
        isRead: false,
        createdAt: new Date('2024-01-15'),
        ...overrides
    }),

    // Create mock story
    createMockStory: (overrides = {}) => ({
        _id: '507f1f77bcf86cd799439055',
        title: 'Test Story',
        content: 'Once upon a time...',
        author: 'Test Author',
        createdAt: new Date('2024-01-15'),
        isShared: true,
        ...overrides
    }),

    // Create mock challenge based on your Challenge interface
    createMockChallenge: (overrides = {}) => ({
        _id: '507f1f77bcf86cd799439016',
        title: 'Test Challenge',
        content: 'Test challenge content',
        starsReward: 10,
        coinsReward: 5,
        // Mock methods
        toString: jest.fn(() => '507f1f77bcf86cd799439016'),
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
                content: 'A test challenge content',
                starsReward: 10,
                coinsReward: 5,
                toString: jest.fn(() => '507f1f77bcf86cd799439016')
            }
        ],
        starsReward: 100,
        coinsReward: 50,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        // Mock Mongoose methods
        save: jest.fn().mockResolvedValue(true),
        toString: jest.fn(() => '507f1f77bcf86cd799439015'),
        ...overrides
    }),

    // Create mock adventure with challenges - ADDED FOR CHALLENGE CONTROLLER TESTS
    createMockAdventureWithChallenges: (challenges : any[] = []) => {
        const defaultChallenges = challenges.length > 0 ? challenges : [
            {
                _id: '507f1f77bcf86cd799439016', // testUtils.ids.challenge
                title: 'Test Challenge',
                content: 'Test challenge content',
                starsReward: 10,
                coinsReward: 5,
                toString: jest.fn(() => '507f1f77bcf86cd799439016')
            }
        ];

        return testUtils.createMockAdventure({
            challenges: Object.assign(defaultChallenges, {
                push: jest.fn(),
                find: jest.fn(),
                findIndex: jest.fn(),
                splice: jest.fn()
            })
        });
    },

    // Add this to your testUtils object in setup.js/ts
    createMockStoreItem: (overrides = {}) => ({
        _id: '507f1f77bcf86cd799439060',
        name: 'Test Item',
        description: 'A test store item',
        type: 'avatar',
        price: 50,
        image: '/assets/images/store/test-item.png',
        save: jest.fn().mockResolvedValue(true),
        toString: jest.fn(() => '507f1f77bcf86cd799439060'),
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

    // Helper method to create mock family member
    createMockFamilyMember: (overrides = {}) => ({
        _id: '507f1f77bcf86cd799439030',
        name: 'Test Member',
        role: 'child',
        gender: 'male',
        avatar: '/assets/images/avatars/child/avatar1.png',
        ...overrides
    }),

    // Helper method to create time period mock for getTimePeriod utility
    createMockTimePeriod: (timeFrame = 'monthly') => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        return { start, end };
    },

    // Helper to create mock leaderboard entry
    createMockLeaderboardEntry: (overrides = {}) => ({
        familyId: '507f1f77bcf86cd799439012',
        familyName: 'Test Family',
        familyAvatar: '/assets/images/family-avatars/default.png',
        stars: 100,
        tasks: 10,
        rank: 1,
        ...overrides
    }),

    // Helper to create mock family progress data
    createMockFamilyProgress: (overrides = {}) => ({
        totalTasks: 10,
        completedTasks: 7,
        totalGoals: 3,
        completedGoals: 2,
        totalAchievements: 50,
        unlockedAchievements: 15,
        ...overrides
    }),

    // Date helpers for consistent testing
    dates: {
        past: new Date('2023-01-01'),
        recent: new Date('2024-01-15'),
        current: new Date('2024-01-20'),
        future: new Date('2024-12-31')
    },

    // Common test IDs
    ids: {
        family: '507f1f77bcf86cd799439012',
        user: '507f1f77bcf86cd799439011',
        goal: '507f1f77bcf86cd799439020',
        task: '507f1f77bcf86cd799439025',
        achievement: '507f1f77bcf86cd799439040',
        adventure: '507f1f77bcf86cd799439015',
        challenge: '507f1f77bcf86cd799439016',
        storeItem: '507f1f77bcf86cd799439060'
    }
};