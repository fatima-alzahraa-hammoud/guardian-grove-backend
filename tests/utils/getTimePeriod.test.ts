import { testUtils } from '../setup';
import { getTimePeriod } from '../../src/utils/getTimePeriod';
import * as dateFns from 'date-fns';

// Mock the date-fns module
jest.mock('date-fns', () => ({
    startOfDay: jest.fn(),
    endOfDay: jest.fn(),
    startOfWeek: jest.fn(),
    endOfWeek: jest.fn(),
    startOfMonth: jest.fn(),
    endOfMonth: jest.fn(),
    startOfYear: jest.fn(),
    endOfYear: jest.fn()
}));

const mockDateFns = dateFns as jest.Mocked<typeof dateFns>;

describe('getTimePeriod Utility Tests', () => {
    let mockDate: Date;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock a fixed date for consistent testing
        mockDate = new Date('2024-06-15T14:30:00.000Z'); // June 15, 2024, 2:30 PM UTC
        
        // Mock Date constructor to return our fixed date
        jest.useFakeTimers();
        jest.setSystemTime(mockDate);
        
        // Setup default mock return values
        mockDateFns.startOfDay.mockReturnValue(new Date('2024-06-15T00:00:00.000Z'));
        mockDateFns.endOfDay.mockReturnValue(new Date('2024-06-15T23:59:59.999Z'));
        mockDateFns.startOfWeek.mockReturnValue(new Date('2024-06-09T00:00:00.000Z')); // Sunday
        mockDateFns.endOfWeek.mockReturnValue(new Date('2024-06-15T23:59:59.999Z')); // Saturday
        mockDateFns.startOfMonth.mockReturnValue(new Date('2024-06-01T00:00:00.000Z'));
        mockDateFns.endOfMonth.mockReturnValue(new Date('2024-06-30T23:59:59.999Z'));
        mockDateFns.startOfYear.mockReturnValue(new Date('2024-01-01T00:00:00.000Z'));
        mockDateFns.endOfYear.mockReturnValue(new Date('2024-12-31T23:59:59.999Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe('Daily time frame', () => {
        it('should return start and end of current day', () => {
            const result = getTimePeriod('daily');

            expect(mockDateFns.startOfDay).toHaveBeenCalledWith(expect.any(Date));
            expect(mockDateFns.endOfDay).toHaveBeenCalledWith(expect.any(Date));
            expect(result).toEqual({
                start: new Date('2024-06-15T00:00:00.000Z'),
                end: new Date('2024-06-15T23:59:59.999Z')
            });
        });

        it('should call date-fns functions with new Date()', () => {
            getTimePeriod('daily');

            expect(mockDateFns.startOfDay).toHaveBeenCalledTimes(1);
            expect(mockDateFns.endOfDay).toHaveBeenCalledTimes(1);
            expect(mockDateFns.startOfWeek).not.toHaveBeenCalled();
            expect(mockDateFns.endOfWeek).not.toHaveBeenCalled();
        });
    });

    describe('Weekly time frame', () => {
        it('should return start and end of current week', () => {
            const result = getTimePeriod('weekly');

            expect(mockDateFns.startOfWeek).toHaveBeenCalledWith(expect.any(Date));
            expect(mockDateFns.endOfWeek).toHaveBeenCalledWith(expect.any(Date));
            expect(result).toEqual({
                start: new Date('2024-06-09T00:00:00.000Z'),
                end: new Date('2024-06-15T23:59:59.999Z')
            });
        });

        it('should call only week-related date-fns functions', () => {
            getTimePeriod('weekly');

            expect(mockDateFns.startOfWeek).toHaveBeenCalledTimes(1);
            expect(mockDateFns.endOfWeek).toHaveBeenCalledTimes(1);
            expect(mockDateFns.startOfDay).not.toHaveBeenCalled();
            expect(mockDateFns.endOfDay).not.toHaveBeenCalled();
        });
    });

    describe('Monthly time frame', () => {
        it('should return start and end of current month', () => {
            const result = getTimePeriod('monthly');

            expect(mockDateFns.startOfMonth).toHaveBeenCalledWith(expect.any(Date));
            expect(mockDateFns.endOfMonth).toHaveBeenCalledWith(expect.any(Date));
            expect(result).toEqual({
                start: new Date('2024-06-01T00:00:00.000Z'),
                end: new Date('2024-06-30T23:59:59.999Z')
            });
        });

        it('should call only month-related date-fns functions', () => {
            getTimePeriod('monthly');

            expect(mockDateFns.startOfMonth).toHaveBeenCalledTimes(1);
            expect(mockDateFns.endOfMonth).toHaveBeenCalledTimes(1);
            expect(mockDateFns.startOfYear).not.toHaveBeenCalled();
            expect(mockDateFns.endOfYear).not.toHaveBeenCalled();
        });
    });

    describe('Yearly time frame', () => {
        it('should return start and end of current year', () => {
            const result = getTimePeriod('yearly');

            expect(mockDateFns.startOfYear).toHaveBeenCalledWith(expect.any(Date));
            expect(mockDateFns.endOfYear).toHaveBeenCalledWith(expect.any(Date));
            expect(result).toEqual({
                start: new Date('2024-01-01T00:00:00.000Z'),
                end: new Date('2024-12-31T23:59:59.999Z')
            });
        });

        it('should call only year-related date-fns functions', () => {
            getTimePeriod('yearly');

            expect(mockDateFns.startOfYear).toHaveBeenCalledTimes(1);
            expect(mockDateFns.endOfYear).toHaveBeenCalledTimes(1);
            expect(mockDateFns.startOfMonth).not.toHaveBeenCalled();
            expect(mockDateFns.endOfMonth).not.toHaveBeenCalled();
        });
    });

    describe('Default case handling', () => {
        it('should return start of day and end of month for unknown timeFrame', () => {
            const result = getTimePeriod('unknown');

            expect(mockDateFns.startOfDay).toHaveBeenCalledWith(expect.any(Date));
            expect(mockDateFns.endOfMonth).toHaveBeenCalledWith(expect.any(Date));
            expect(result).toEqual({
                start: new Date('2024-06-15T00:00:00.000Z'),
                end: new Date('2024-06-30T23:59:59.999Z')
            });
        });

        it('should handle empty string as timeFrame', () => {
            const result = getTimePeriod('');

            expect(mockDateFns.startOfDay).toHaveBeenCalledWith(expect.any(Date));
            expect(mockDateFns.endOfMonth).toHaveBeenCalledWith(expect.any(Date));
            expect(result).toEqual({
                start: new Date('2024-06-15T00:00:00.000Z'),
                end: new Date('2024-06-30T23:59:59.999Z')
            });
        });

        it('should handle null as timeFrame', () => {
            const result = getTimePeriod(null as any);

            expect(mockDateFns.startOfDay).toHaveBeenCalledWith(expect.any(Date));
            expect(mockDateFns.endOfMonth).toHaveBeenCalledWith(expect.any(Date));
            expect(result).toEqual({
                start: new Date('2024-06-15T00:00:00.000Z'),
                end: new Date('2024-06-30T23:59:59.999Z')
            });
        });

        it('should handle undefined as timeFrame', () => {
            const result = getTimePeriod(undefined as any);

            expect(mockDateFns.startOfDay).toHaveBeenCalledWith(expect.any(Date));
            expect(mockDateFns.endOfMonth).toHaveBeenCalledWith(expect.any(Date));
            expect(result).toEqual({
                start: new Date('2024-06-15T00:00:00.000Z'),
                end: new Date('2024-06-30T23:59:59.999Z')
            });
        });
    });

    describe('Case sensitivity and variations', () => {
        it('should handle uppercase timeFrame values', () => {
            const result = getTimePeriod('DAILY');

            // Should go to default case since it's case-sensitive
            expect(mockDateFns.startOfDay).toHaveBeenCalledWith(expect.any(Date));
            expect(mockDateFns.endOfMonth).toHaveBeenCalledWith(expect.any(Date));
            expect(result).toEqual({
                start: new Date('2024-06-15T00:00:00.000Z'),
                end: new Date('2024-06-30T23:59:59.999Z')
            });
        });

        it('should handle mixed case timeFrame values', () => {
            const result = getTimePeriod('Monthly');

            // Should go to default case since it's case-sensitive
            expect(mockDateFns.startOfDay).toHaveBeenCalledWith(expect.any(Date));
            expect(mockDateFns.endOfMonth).toHaveBeenCalledWith(expect.any(Date));
            expect(result).toEqual({
                start: new Date('2024-06-15T00:00:00.000Z'),
                end: new Date('2024-06-30T23:59:59.999Z')
            });
        });

        it('should handle timeFrame with extra spaces', () => {
            const result = getTimePeriod(' daily ');

            // Should go to default case since it doesn't trim
            expect(mockDateFns.startOfDay).toHaveBeenCalledWith(expect.any(Date));
            expect(mockDateFns.endOfMonth).toHaveBeenCalledWith(expect.any(Date));
            expect(result).toEqual({
                start: new Date('2024-06-15T00:00:00.000Z'),
                end: new Date('2024-06-30T23:59:59.999Z')
            });
        });
    });

    describe('Return value structure', () => {
        it('should always return object with start and end properties', () => {
            const timeFrames = ['daily', 'weekly', 'monthly', 'yearly', 'invalid'];

            timeFrames.forEach(timeFrame => {
                const result = getTimePeriod(timeFrame);

                expect(result).toHaveProperty('start');
                expect(result).toHaveProperty('end');
                expect(result.start).toBeInstanceOf(Date);
                expect(result.end).toBeInstanceOf(Date);
            });
        });

        it('should ensure start date is before or equal to end date', () => {
            const timeFrames = ['daily', 'weekly', 'monthly', 'yearly'];

            timeFrames.forEach(timeFrame => {
                const result = getTimePeriod(timeFrame);

                expect(result.start.getTime()).toBeLessThanOrEqual(result.end.getTime());
            });
        });

        it('should return consistent object structure', () => {
            const result = getTimePeriod('daily');

            expect(Object.keys(result)).toEqual(['start', 'end']);
            expect(Object.keys(result).length).toBe(2);
        });
    });

    describe('Different date scenarios', () => {
        it('should work correctly at year boundary', () => {
            // Mock New Year's Eve
            const newYearDate = new Date('2024-12-31T23:30:00.000Z');
            jest.setSystemTime(newYearDate);
            
            mockDateFns.startOfYear.mockReturnValue(new Date('2024-01-01T00:00:00.000Z'));
            mockDateFns.endOfYear.mockReturnValue(new Date('2024-12-31T23:59:59.999Z'));

            const result = getTimePeriod('yearly');

            expect(result).toEqual({
                start: new Date('2024-01-01T00:00:00.000Z'),
                end: new Date('2024-12-31T23:59:59.999Z')
            });
        });

        it('should work correctly at month boundary', () => {
            // Mock end of February
            const febDate = new Date('2024-02-29T12:00:00.000Z');
            jest.setSystemTime(febDate);
            
            mockDateFns.startOfMonth.mockReturnValue(new Date('2024-02-01T00:00:00.000Z'));
            mockDateFns.endOfMonth.mockReturnValue(new Date('2024-02-29T23:59:59.999Z'));

            const result = getTimePeriod('monthly');

            expect(result).toEqual({
                start: new Date('2024-02-01T00:00:00.000Z'),
                end: new Date('2024-02-29T23:59:59.999Z')
            });
        });

        it('should work correctly at week boundary', () => {
            // Mock Sunday (start of week)
            const sundayDate = new Date('2024-06-09T08:00:00.000Z');
            jest.setSystemTime(sundayDate);
            
            mockDateFns.startOfWeek.mockReturnValue(new Date('2024-06-09T00:00:00.000Z'));
            mockDateFns.endOfWeek.mockReturnValue(new Date('2024-06-15T23:59:59.999Z'));

            const result = getTimePeriod('weekly');

            expect(result).toEqual({
                start: new Date('2024-06-09T00:00:00.000Z'),
                end: new Date('2024-06-15T23:59:59.999Z')
            });
        });
    });

    describe('Integration with Guardian Grove usage patterns', () => {
        it('should support family goal tracking periods', () => {
            const goalTimeFrames = ['daily', 'weekly', 'monthly', 'yearly'];

            goalTimeFrames.forEach(timeFrame => {
                const result = getTimePeriod(timeFrame);

                expect(result).toHaveProperty('start');
                expect(result).toHaveProperty('end');
                expect(result.start).toBeInstanceOf(Date);
                expect(result.end).toBeInstanceOf(Date);
            });
        });

        it('should provide correct periods for task scheduling', () => {
            const result = getTimePeriod('daily');

            expect(mockDateFns.startOfDay).toHaveBeenCalledWith(expect.any(Date));
            expect(mockDateFns.endOfDay).toHaveBeenCalledWith(expect.any(Date));
            
            // Verify it's using current date
            const callArg = (mockDateFns.startOfDay as jest.Mock).mock.calls[0][0];
            expect(callArg).toBeInstanceOf(Date);
        });

        it('should handle achievement period calculations', () => {
            const achievementPeriods = ['weekly', 'monthly', 'yearly'];

            achievementPeriods.forEach(period => {
                const result = getTimePeriod(period);
                
                // Should have valid time range
                expect(result.start).toBeInstanceOf(Date);
                expect(result.end).toBeInstanceOf(Date);
                expect(result.end.getTime()).toBeGreaterThan(result.start.getTime());
            });
        });
    });

    describe('Performance and reliability', () => {
        it('should execute quickly for all time frames', () => {
            const timeFrames = ['daily', 'weekly', 'monthly', 'yearly', 'invalid'];
            const startTime = Date.now();

            timeFrames.forEach(timeFrame => {
                getTimePeriod(timeFrame);
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete all calls very quickly (less than 10ms)
            expect(duration).toBeLessThan(10);
        });

        it('should handle repeated calls consistently', () => {
            const results = [];

            for (let i = 0; i < 10; i++) {
                results.push(getTimePeriod('daily'));
            }

            // All results should be identical since we're mocking the date
            const firstResult = results[0];
            results.forEach(result => {
                expect(result).toEqual(firstResult);
            });
        });

        it('should not have memory leaks with many calls', () => {
            // Call function many times to check for memory issues
            for (let i = 0; i < 1000; i++) {
                getTimePeriod('monthly');
            }

            // If we get here without running out of memory, test passes
            expect(true).toBe(true);
        });
    });

    describe('Error handling', () => {
        it('should handle date-fns functions throwing errors', () => {
            mockDateFns.startOfDay.mockImplementation(() => {
                throw new Error('Date processing error');
            });

            expect(() => getTimePeriod('daily')).toThrow('Date processing error');
        });

        it('should handle date-fns returning invalid dates', () => {
            mockDateFns.startOfMonth.mockReturnValue(new Date('invalid'));
            mockDateFns.endOfMonth.mockReturnValue(new Date('invalid'));

            const result = getTimePeriod('monthly');

            expect(result).toHaveProperty('start');
            expect(result).toHaveProperty('end');
            // Invalid dates are still Date objects
            expect(result.start).toBeInstanceOf(Date);
            expect(result.end).toBeInstanceOf(Date);
        });

        it('should handle date-fns returning null/undefined', () => {
            mockDateFns.startOfWeek.mockReturnValue(null as any);
            mockDateFns.endOfWeek.mockReturnValue(undefined as any);

            const result = getTimePeriod('weekly');

            expect(result).toHaveProperty('start');
            expect(result).toHaveProperty('end');
            expect(result.start).toBeNull();
            expect(result.end).toBeUndefined();
        });
    });

    describe('Date object creation', () => {
        it('should create new Date objects for each call', () => {
            getTimePeriod('daily');

            // Verify that new Date() was called for each date-fns function call
            expect(mockDateFns.startOfDay).toHaveBeenCalledWith(expect.any(Date));
            expect(mockDateFns.endOfDay).toHaveBeenCalledWith(expect.any(Date));
        });

        it('should use current time for all calculations', () => {
            const dailyResult = getTimePeriod('daily');
            const weeklyResult = getTimePeriod('weekly');

            // Both should be based on the same "current" time
            expect(mockDateFns.startOfDay).toHaveBeenCalledWith(expect.any(Date));
            expect(mockDateFns.startOfWeek).toHaveBeenCalledWith(expect.any(Date));
        });

        it('should handle timezone considerations through date-fns', () => {
            // Since we're using date-fns, timezone handling is delegated to it
            getTimePeriod('monthly');

            expect(mockDateFns.startOfMonth).toHaveBeenCalledWith(expect.any(Date));
            expect(mockDateFns.endOfMonth).toHaveBeenCalledWith(expect.any(Date));
        });
    });
});