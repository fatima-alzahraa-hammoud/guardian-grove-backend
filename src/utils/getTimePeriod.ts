import { endOfDay, endOfMonth, endOfWeek, endOfYear, startOfDay, startOfMonth, startOfWeek, startOfYear } from "date-fns";

// Helper function to get the date range for different time frames
export const getTimePeriod = (timeFrame: string) => {
    const now = new Date();
    switch (timeFrame) {
        case "daily":
            return { start: startOfDay(new Date()), end: endOfDay(new Date()) };
        case "weekly":
            return { start: startOfWeek(new Date()), end: endOfWeek(new Date()) };
        case "monthly":
            return { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };
        case "yearly":
            return { start: startOfYear(new Date()), end: endOfYear(new Date()) };
        default:
            return { start: startOfDay(new Date()), end: endOfMonth(new Date()) };
    }
};
