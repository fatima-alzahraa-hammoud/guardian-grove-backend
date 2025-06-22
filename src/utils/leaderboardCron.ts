import schedule from 'node-schedule';
import { Family } from '../models/family.model';

// Utility function to reset leaderboard fields
const resetLeaderboard = async (starsField: string, tasksField: string, period: string): Promise<void> => {
    try {
        await Family.updateMany({}, { [starsField]: 0, [tasksField]: 0 });
        console.log(`${period} leaderboard reset successfully.`);
    } catch (error) {
        console.error(`Failed to reset ${period} leaderboard:`, error);
    }
};

// Schedule Jobs

// Daily reset at midnight
schedule.scheduleJob('0 0 * * *', async () => {
    await resetLeaderboard('stars.daily', 'taskCounts.daily', 'Daily');
});

// Weekly reset at midnight (Sunday)
schedule.scheduleJob('0 0 * * 0', async () => {
    await resetLeaderboard('stars.weekly', 'taskCounts.weekly', 'Weekly');
});

// Monthly reset at midnight (1st day of each month)
schedule.scheduleJob('0 0 1 * *', async () => {
    await resetLeaderboard('stars.monthly', 'taskCounts.monthly', 'Monthly');
});

// Yearly reset at midnight (1st January)
schedule.scheduleJob('0 0 1 1 *', async () => {
    await resetLeaderboard('stars.yearly', 'taskCounts.yearly', 'Yearly');
});