import { testUtils } from '../setup';
import { recalculateFamilyMemberRanks } from '../../src/utils/recalculateFamilyMemberRanks';
import { User } from '../../src/models/user.model';
import { Types } from 'mongoose';

// Mock the User model
jest.mock('../../src/models/user.model', () => ({
    User: {
        find: jest.fn()
    }
}));

const mockUser = User as jest.Mocked<typeof User>;

describe('recalculateFamilyMemberRanks Helper Tests', () => {
    let mockFamilyId: Types.ObjectId;
    let mockUpdatedUser: any;
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup test data
        mockFamilyId = new Types.ObjectId(testUtils.ids.family);
        mockUpdatedUser = testUtils.createMockUser({
            _id: new Types.ObjectId(testUtils.ids.user),
            stars: 100,
            nbOfTasksCompleted: 10,
            rankInFamily: 0 // Will be updated by the function
        });

        // Mock console.error to test error handling
        consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe('Successful ranking calculations', () => {
        it('should correctly rank family members by stars (descending)', async () => {
            // Create mock family members with different star counts
            const mockMember1 = testUtils.createMockUser({
                _id: new Types.ObjectId('507f1f77bcf86cd799439001'),
                stars: 200,
                nbOfTasksCompleted: 5,
                rankInFamily: 0
            });
            const mockMember2 = testUtils.createMockUser({
                _id: new Types.ObjectId(testUtils.ids.user),
                stars: 100,
                nbOfTasksCompleted: 10,
                rankInFamily: 0
            });
            const mockMember3 = testUtils.createMockUser({
                _id: new Types.ObjectId('507f1f77bcf86cd799439003'),
                stars: 50,
                nbOfTasksCompleted: 15,
                rankInFamily: 0
            });

            const mockMembers = [mockMember1, mockMember2, mockMember3];

            // Mock User.find to return sorted members
            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockMembers)
            };
            mockUser.find.mockReturnValue(mockQuery as any);

            await recalculateFamilyMemberRanks(mockFamilyId, mockUpdatedUser);

            // Verify User.find was called correctly
            expect(mockUser.find).toHaveBeenCalledWith({ familyId: mockFamilyId });
            expect(mockQuery.sort).toHaveBeenCalledWith({ stars: -1, nbOfTasksCompleted: -1 });
            expect(mockQuery.exec).toHaveBeenCalled();

            // Verify ranks were assigned correctly
            expect(mockMember1.rankInFamily).toBe(1); // 200 stars - rank 1
            expect(mockMember2.rankInFamily).toBe(2); // 100 stars - rank 2
            expect(mockMember3.rankInFamily).toBe(3); // 50 stars - rank 3

            // Verify updated user rank was set correctly
            expect(mockUpdatedUser.rankInFamily).toBe(2);

            // Verify all members were saved
            expect(mockMember1.save).toHaveBeenCalled();
            expect(mockMember2.save).toHaveBeenCalled();
            expect(mockMember3.save).toHaveBeenCalled();
        });

        it('should handle tied stars by using nbOfTasksCompleted as tiebreaker', async () => {
            const mockMember1 = testUtils.createMockUser({
                _id: new Types.ObjectId('507f1f77bcf86cd799439001'),
                stars: 100,
                nbOfTasksCompleted: 20, // More tasks - higher rank
                rankInFamily: 0
            });
            const mockMember2 = testUtils.createMockUser({
                _id: new Types.ObjectId(testUtils.ids.user),
                stars: 100,
                nbOfTasksCompleted: 10, // Fewer tasks - lower rank
                rankInFamily: 0
            });

            const mockMembers = [mockMember1, mockMember2];

            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockMembers)
            };
            mockUser.find.mockReturnValue(mockQuery as any);

            await recalculateFamilyMemberRanks(mockFamilyId, mockUpdatedUser);

            // Verify ranks with tiebreaker
            expect(mockMember1.rankInFamily).toBe(1); // Same stars, more tasks - rank 1
            expect(mockMember2.rankInFamily).toBe(2); // Same stars, fewer tasks - rank 2
            expect(mockUpdatedUser.rankInFamily).toBe(2);
        });

        it('should assign same rank to members with identical stats', async () => {
            const mockMember1 = testUtils.createMockUser({
                _id: new Types.ObjectId('507f1f77bcf86cd799439001'),
                stars: 100,
                nbOfTasksCompleted: 10,
                rankInFamily: 0
            });
            const mockMember2 = testUtils.createMockUser({
                _id: new Types.ObjectId(testUtils.ids.user),
                stars: 100,
                nbOfTasksCompleted: 10, // Same as member1
                rankInFamily: 0
            });
            const mockMember3 = testUtils.createMockUser({
                _id: new Types.ObjectId('507f1f77bcf86cd799439003'),
                stars: 50,
                nbOfTasksCompleted: 5,
                rankInFamily: 0
            });

            const mockMembers = [mockMember1, mockMember2, mockMember3];

            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockMembers)
            };
            mockUser.find.mockReturnValue(mockQuery as any);

            await recalculateFamilyMemberRanks(mockFamilyId, mockUpdatedUser);

            // Verify tied members get same rank
            expect(mockMember1.rankInFamily).toBe(1);
            expect(mockMember2.rankInFamily).toBe(1); // Same rank as member1
            expect(mockMember3.rankInFamily).toBe(3); // Next rank is 3 (not 2)
            expect(mockUpdatedUser.rankInFamily).toBe(1);
        });

        it('should handle single family member correctly', async () => {
            const mockMember = testUtils.createMockUser({
                _id: new Types.ObjectId(testUtils.ids.user),
                stars: 100,
                nbOfTasksCompleted: 10,
                rankInFamily: 0
            });

            const mockMembers = [mockMember];

            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockMembers)
            };
            mockUser.find.mockReturnValue(mockQuery as any);

            await recalculateFamilyMemberRanks(mockFamilyId, mockUpdatedUser);

            expect(mockMember.rankInFamily).toBe(1);
            expect(mockUpdatedUser.rankInFamily).toBe(1);
            expect(mockMember.save).toHaveBeenCalled();
        });

        it('should handle empty family members array', async () => {
            const mockMembers: any[] = [];

            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockMembers)
            };
            mockUser.find.mockReturnValue(mockQuery as any);

            await recalculateFamilyMemberRanks(mockFamilyId, mockUpdatedUser);

            // Should not throw error and should complete successfully
            expect(mockUser.find).toHaveBeenCalledWith({ familyId: mockFamilyId });
            expect(mockUpdatedUser.rankInFamily).toBe(0); // Unchanged
        });
    });

    describe('UpdatedUser handling', () => {
        it('should update the provided updatedUser rank when found in family', async () => {
            const mockMember1 = testUtils.createMockUser({
                _id: new Types.ObjectId('507f1f77bcf86cd799439001'),
                stars: 200,
                nbOfTasksCompleted: 5,
                rankInFamily: 0
            });
            const mockMember2 = testUtils.createMockUser({
                _id: new Types.ObjectId(testUtils.ids.user), // Same as updatedUser
                stars: 100,
                nbOfTasksCompleted: 10,
                rankInFamily: 0
            });

            const mockMembers = [mockMember1, mockMember2];

            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockMembers)
            };
            mockUser.find.mockReturnValue(mockQuery as any);

            await recalculateFamilyMemberRanks(mockFamilyId, mockUpdatedUser);

            // Verify updatedUser was updated correctly
            expect(mockUpdatedUser.rankInFamily).toBe(2);
            expect(mockMember2.rankInFamily).toBe(2);
        });

        it('should not update updatedUser rank when not found in family', async () => {
            const mockMember1 = testUtils.createMockUser({
                _id: new Types.ObjectId('507f1f77bcf86cd799439001'),
                stars: 200,
                nbOfTasksCompleted: 5,
                rankInFamily: 0
            });

            // updatedUser has different ID than family members
            mockUpdatedUser._id = new Types.ObjectId('507f1f77bcf86cd799439999');
            const originalRank = mockUpdatedUser.rankInFamily;

            const mockMembers = [mockMember1];

            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockMembers)
            };
            mockUser.find.mockReturnValue(mockQuery as any);

            await recalculateFamilyMemberRanks(mockFamilyId, mockUpdatedUser);

            // Verify updatedUser rank was not changed
            expect(mockUpdatedUser.rankInFamily).toBe(originalRank);
            expect(mockMember1.rankInFamily).toBe(1);
        });
    });

    describe('Complex ranking scenarios', () => {
        it('should handle multiple ties and rank gaps correctly', async () => {
            const mockMember1 = testUtils.createMockUser({
                _id: new Types.ObjectId('507f1f77bcf86cd799439001'),
                stars: 200,
                nbOfTasksCompleted: 10,
                rankInFamily: 0
            });
            const mockMember2 = testUtils.createMockUser({
                _id: new Types.ObjectId('507f1f77bcf86cd799439002'),
                stars: 100,
                nbOfTasksCompleted: 15,
                rankInFamily: 0
            });
            const mockMember3 = testUtils.createMockUser({
                _id: new Types.ObjectId('507f1f77bcf86cd799439003'),
                stars: 100,
                nbOfTasksCompleted: 15, // Tied with member2
                rankInFamily: 0
            });
            const mockMember4 = testUtils.createMockUser({
                _id: new Types.ObjectId(testUtils.ids.user),
                stars: 50,
                nbOfTasksCompleted: 5,
                rankInFamily: 0
            });

            const mockMembers = [mockMember1, mockMember2, mockMember3, mockMember4];

            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockMembers)
            };
            mockUser.find.mockReturnValue(mockQuery as any);

            await recalculateFamilyMemberRanks(mockFamilyId, mockUpdatedUser);

            expect(mockMember1.rankInFamily).toBe(1); // 200 stars - rank 1
            expect(mockMember2.rankInFamily).toBe(2); // 100 stars, 15 tasks - rank 2
            expect(mockMember3.rankInFamily).toBe(2); // Same as member2 - rank 2
            expect(mockMember4.rankInFamily).toBe(4); // 50 stars - rank 4 (not 3!)
            expect(mockUpdatedUser.rankInFamily).toBe(4);
        });

        it('should handle zero stats correctly', async () => {
            const mockMember1 = testUtils.createMockUser({
                _id: new Types.ObjectId('507f1f77bcf86cd799439001'),
                stars: 0,
                nbOfTasksCompleted: 0,
                rankInFamily: 0
            });
            const mockMember2 = testUtils.createMockUser({
                _id: new Types.ObjectId(testUtils.ids.user),
                stars: 0,
                nbOfTasksCompleted: 0,
                rankInFamily: 0
            });

            const mockMembers = [mockMember1, mockMember2];

            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockMembers)
            };
            mockUser.find.mockReturnValue(mockQuery as any);

            await recalculateFamilyMemberRanks(mockFamilyId, mockUpdatedUser);

            expect(mockMember1.rankInFamily).toBe(1);
            expect(mockMember2.rankInFamily).toBe(1); // Tied for first
            expect(mockUpdatedUser.rankInFamily).toBe(1);
        });

        it('should handle large family with many members', async () => {
            const mockMembers = [];
            for (let i = 0; i < 10; i++) {
                mockMembers.push(testUtils.createMockUser({
                    _id: new Types.ObjectId(`507f1f77bcf86cd79943900${i}`),
                    stars: 100 - (i * 10), // Decreasing stars
                    nbOfTasksCompleted: 5,
                    rankInFamily: 0
                }));
            }

            // Make one of them the updated user
            mockMembers[5]._id = new Types.ObjectId(testUtils.ids.user) as any;

            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockMembers)
            };
            mockUser.find.mockReturnValue(mockQuery as any);

            await recalculateFamilyMemberRanks(mockFamilyId, mockUpdatedUser);

            // Verify all ranks are assigned correctly
            mockMembers.forEach((member, index) => {
                expect(member.rankInFamily).toBe(index + 1);
            });

            expect(mockUpdatedUser.rankInFamily).toBe(6); // Position of updated user
        });
    });

    describe('Error handling', () => {
        it('should handle database query errors gracefully', async () => {
            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockRejectedValue(new Error('Database connection failed'))
            };
            mockUser.find.mockReturnValue(mockQuery as any);

            // Should not throw error
            await expect(recalculateFamilyMemberRanks(mockFamilyId, mockUpdatedUser)).resolves.toBeUndefined();

            // Should log error
            expect(consoleSpy).toHaveBeenCalledWith('Error recalculating ranks:', expect.any(Error));
        });

        it('should handle save errors gracefully', async () => {
            const mockMember = testUtils.createMockUser({
                _id: new Types.ObjectId(testUtils.ids.user),
                stars: 100,
                nbOfTasksCompleted: 10,
                rankInFamily: 0,
                save: jest.fn().mockRejectedValue(new Error('Save failed'))
            });

            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([mockMember])
            };
            mockUser.find.mockReturnValue(mockQuery as any);

            // Should not throw error
            await expect(recalculateFamilyMemberRanks(mockFamilyId, mockUpdatedUser)).resolves.toBeUndefined();

            // Should log error
            expect(consoleSpy).toHaveBeenCalledWith('Error recalculating ranks:', expect.any(Error));
        });

        it('should handle malformed family members data', async () => {
            const malformedMember = {
                _id: new Types.ObjectId(testUtils.ids.user),
                stars: undefined, // Malformed data
                nbOfTasksCompleted: null,
                rankInFamily: 0,
                save: jest.fn().mockResolvedValue(true)
            };

            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([malformedMember])
            };
            mockUser.find.mockReturnValue(mockQuery as any);

            // Should handle gracefully
            await recalculateFamilyMemberRanks(mockFamilyId, mockUpdatedUser);

            // Should still attempt to process
            expect(malformedMember.save).toHaveBeenCalled();
        });
    });

    describe('Promise handling', () => {
        it('should save all members concurrently using Promise.all', async () => {
            const mockMember1 = testUtils.createMockUser({
                _id: new Types.ObjectId('507f1f77bcf86cd799439001'),
                stars: 100,
                nbOfTasksCompleted: 10,
                rankInFamily: 0
            });
            const mockMember2 = testUtils.createMockUser({
                _id: new Types.ObjectId(testUtils.ids.user),
                stars: 50,
                nbOfTasksCompleted: 5,
                rankInFamily: 0
            });

            const mockMembers = [mockMember1, mockMember2];

            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockMembers)
            };
            mockUser.find.mockReturnValue(mockQuery as any);

            const startTime = Date.now();
            await recalculateFamilyMemberRanks(mockFamilyId, mockUpdatedUser);
            const endTime = Date.now();

            // Should complete quickly (concurrent saves)
            expect(endTime - startTime).toBeLessThan(100);

            // Both saves should have been called
            expect(mockMember1.save).toHaveBeenCalled();
            expect(mockMember2.save).toHaveBeenCalled();
        });

        it('should handle mixed save success/failure in Promise.all', async () => {
            const mockMember1 = testUtils.createMockUser({
                _id: new Types.ObjectId('507f1f77bcf86cd799439001'),
                stars: 100,
                nbOfTasksCompleted: 10,
                rankInFamily: 0,
                save: jest.fn().mockResolvedValue(true) // Success
            });
            const mockMember2 = testUtils.createMockUser({
                _id: new Types.ObjectId(testUtils.ids.user),
                stars: 50,
                nbOfTasksCompleted: 5,
                rankInFamily: 0,
                save: jest.fn().mockRejectedValue(new Error('Save failed')) // Failure
            });

            const mockMembers = [mockMember1, mockMember2];

            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockMembers)
            };
            mockUser.find.mockReturnValue(mockQuery as any);

            // Should handle mixed results gracefully
            await expect(recalculateFamilyMemberRanks(mockFamilyId, mockUpdatedUser)).resolves.toBeUndefined();

            expect(consoleSpy).toHaveBeenCalledWith('Error recalculating ranks:', expect.any(Error));
        });
    });

    describe('Integration with Guardian Grove features', () => {
        it('should work correctly with real ObjectId formats', async () => {
            const realFamilyId = new Types.ObjectId();
            const realUserId = new Types.ObjectId();
            
            const mockUser = testUtils.createMockUser({
                _id: realUserId,
                stars: 100,
                nbOfTasksCompleted: 10,
                rankInFamily: 0
            });

            const mockUpdatedUser = testUtils.createMockUser({
                _id: realUserId,
                stars: 100,
                nbOfTasksCompleted: 10,
                rankInFamily: 0
            }) as any; // Type assertion to bypass the error

            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([mockUser])
            };
            (User.find as jest.Mock).mockReturnValue(mockQuery);

            await recalculateFamilyMemberRanks(realFamilyId, mockUpdatedUser);

            expect(mockUser.rankInFamily).toBe(1);
            expect(mockUpdatedUser.rankInFamily).toBe(1);
        });

        it('should handle typical family sizes efficiently', async () => {
            // Test with typical family size (2-8 members)
            const familySizes = [2, 4, 6, 8];

            for (const size of familySizes) {
                jest.clearAllMocks();

                const mockMembers = Array.from({ length: size }, (_, i) => 
                    testUtils.createMockUser({
                        _id: new Types.ObjectId(),
                        stars: 100 - (i * 10),
                        nbOfTasksCompleted: 5,
                        rankInFamily: 0
                    })
                );

                const mockQuery = {
                    sort: jest.fn().mockReturnThis(),
                    exec: jest.fn().mockResolvedValue(mockMembers)
                };
                mockUser.find.mockReturnValue(mockQuery as any);

                const startTime = Date.now();
                await recalculateFamilyMemberRanks(mockFamilyId, mockUpdatedUser);
                const endTime = Date.now();

                // Should complete quickly regardless of family size
                expect(endTime - startTime).toBeLessThan(50);
                
                // Verify all members got proper ranks
                mockMembers.forEach((member, index) => {
                    expect(member.rankInFamily).toBe(index + 1);
                });
            }
        });
    });
});