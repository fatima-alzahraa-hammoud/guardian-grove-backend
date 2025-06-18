"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimePeriod = void 0;
const date_fns_1 = require("date-fns");
// Helper function to get the date range for different time frames
const getTimePeriod = (timeFrame) => {
    const now = new Date();
    switch (timeFrame) {
        case "daily":
            return { start: (0, date_fns_1.startOfDay)(new Date()), end: (0, date_fns_1.endOfDay)(new Date()) };
        case "weekly":
            return { start: (0, date_fns_1.startOfWeek)(new Date()), end: (0, date_fns_1.endOfWeek)(new Date()) };
        case "monthly":
            return { start: (0, date_fns_1.startOfMonth)(new Date()), end: (0, date_fns_1.endOfMonth)(new Date()) };
        case "yearly":
            return { start: (0, date_fns_1.startOfYear)(new Date()), end: (0, date_fns_1.endOfYear)(new Date()) };
        default:
            return { start: (0, date_fns_1.startOfDay)(new Date()), end: (0, date_fns_1.endOfMonth)(new Date()) };
    }
};
exports.getTimePeriod = getTimePeriod;
