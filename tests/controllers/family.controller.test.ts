import { testUtils } from '../setup';
import { getAllFamilies, getFamily, getFamilyMembers } from '../../src/controllers/family.controller';
import { Family } from '../../src/models/family.model';
import { User } from '../../src/models/user.model';
import { Achievement } from '../../src/models/achievements.model';
import * as checkId from '../../src/utils/checkId';
import * as recalculateFamilyMemberRanks from '../../src/utils/recalculateFamilyMemberRanks';
import * as getTimePeriod from '../../src/utils/getTimePeriod';

// Mock all dependencies
jest.mock('../../src/models/family.model');
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/achievements.model');
jest.mock('../../src/utils/checkId');
jest.mock('../../src/utils/recalculateFamilyMemberRanks');
jest.mock('../../src/utils/getTimePeriod');

const mockFamily = Family as jest.Mocked<typeof Family>;
const mockUser = User as jest.Mocked<typeof User>;
const mockAchievement = Achievement as jest.Mocked<typeof Achievement>;
const mockCheckId = checkId as jest.Mocked<typeof checkId>;
const mockRecalculateFamilyMemberRanks = recalculateFamilyMemberRanks as jest.Mocked<typeof recalculateFamilyMemberRanks>;
const mockGetTimePeriod = getTimePeriod as jest.Mocked<typeof getTimePeriod>;

describe('Family Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup Family model methods
        mockFamily.find = jest.fn();
        mockFamily.findOne = jest.fn();
        mockFamily.findById = jest.fn();
        mockFamily.findByIdAndDelete = jest.fn();
        mockFamily.findByIdAndUpdate = jest.fn();
        mockFamily.countDocuments = jest.fn();

        // Setup User model methods
        mockUser.find = jest.fn();
        mockUser.findById = jest.fn();
        mockUser.updateMany = jest.fn();
        mockUser.deleteMany = jest.fn();
        mockUser.aggregate = jest.fn();

        // Setup Achievement model methods
        mockAchievement.findById = jest.fn();
        mockAchievement.countDocuments = jest.fn();
        
        // Setup utility mocks
        mockCheckId.checkId.mockReturnValue(true);
        jest.spyOn(mockRecalculateFamilyMemberRanks, 'recalculateFamilyMemberRanks').mockResolvedValue(undefined);
        mockGetTimePeriod.getTimePeriod.mockReturnValue({
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31')
        });
    });

    // 1. test getAllFamilies API
    describe('getAllFamilies', () => {
        it('should return all families successfully', async () => {
            const mockFamilies = [
                testUtils.createMockFamily({ familyName: 'Smith Family' }),
                testUtils.createMockFamily({ familyName: 'Johnson Family', _id: '507f1f77bcf86cd799439013' })
            ];
            mockFamily.find.mockResolvedValue(mockFamilies as any);

            const mockReq = testUtils.createMockRequest();
            const mockRes = testUtils.createMockResponse();

            await getAllFamilies(mockReq as any, mockRes as any);

            expect(mockFamily.find).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: "Retrieving all families successfully",
                families: mockFamilies
            });
        });

        it('should return 404 if no families found', async () => {
            mockFamily.find.mockResolvedValue([]);

            const mockReq = testUtils.createMockRequest();
            const mockRes = testUtils.createMockResponse();

            await getAllFamilies(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should handle database errors', async () => {
            mockFamily.find.mockRejectedValue(new Error('Database connection failed'));

            const mockReq = testUtils.createMockRequest();
            const mockRes = testUtils.createMockResponse();

            await getAllFamilies(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    // 2. test getFamily API
    describe('getFamily', () => {
        it('should return family by ID successfully', async () => {
            const mockFamilyData = testUtils.createMockFamily();
            const mockFamilyDoc = {
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockFamilyData)
                })
            };
            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamily(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: "Retrieving family successfully",
                family: mockFamilyData
            });
        });

        it('should return 404 if family not found', async () => {
            const mockFamilyDoc = {
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(null)
                })
            };
            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamily(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should return error if invalid ID', async () => {
            mockCheckId.checkId.mockReturnValue(false);

            const mockReq = testUtils.createMockRequest({
                body: { familyId: 'invalid-id' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamily(mockReq as any, mockRes as any);

            expect(mockFamily.findById).not.toHaveBeenCalled();
        });
    });

    // 3. test getFamilyMembers API
    describe('getFamilyMembers', () => {
        it('should return family members successfully', async () => {
            const mockMemberUser = testUtils.createMockUser({ name: 'John Doe' });
            const mockFamilyData = {
                ...testUtils.createMockFamily(),
                members: [{
                    _id: mockMemberUser,
                    role: 'child',
                    gender: 'male',
                    avatar: '/avatar.png'
                }]
            };
            const mockFamilyDoc = {
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockFamilyData)
                })
            };
            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyMembers(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Retrieving family members successfully",
                familyWithMembers: expect.objectContaining({
                    members: expect.arrayContaining([
                        expect.objectContaining({
                            name: 'John Doe',
                            role: 'child',
                            gender: 'male',
                            avatar: '/avatar.png'
                        })
                    ])
                })
            });
        });

        it('should return 404 if family not found', async () => {
            const mockFamilyDoc = {
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(null)
                })
            };
            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyMembers(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });
});