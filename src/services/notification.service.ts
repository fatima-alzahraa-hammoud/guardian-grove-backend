import { User } from "../models/user.model";
import { firebaseAdmin } from "../utils/firebase/firebase";

interface NotificationPayload {
    tokens: string[];
    title: string;
    body: string;
    data?: Record<string, string>;
}

export const createNotificationToMultiple = async ({ tokens, title, body, data = {},}: NotificationPayload) => {
    // Validate input
    if (!tokens || tokens.length === 0) {
        console.warn("⚠️ No tokens provided for notification");
        return { successCount: 0, failureCount: 0 };
    }

    // Filter out empty/invalid tokens
    const validTokens = tokens.filter(token => token && token.trim().length > 0);
    
    if (validTokens.length === 0) {
        console.warn("⚠️ No valid tokens found");
        return { successCount: 0, failureCount: 0 };
    }

    const messages = validTokens.map(token => ({
        notification: {
            title,
            body,
        },
        data,
        token: token,
    }));

    try {
        console.log(`📤 Sending notifications to ${validTokens.length} devices`);
        const response = await firebaseAdmin.messaging().sendEach(messages);

        // Optional: filter and log failed tokens
        const failedTokens = response.responses
        .map((r, i) => (!r.success ? validTokens[i] : null))
        .filter(Boolean);

        console.log(`✅ Notifications sent: ${response.successCount} success, ${response.failureCount} failed`);

        if (failedTokens.length > 0) {
            console.warn("❌ Some tokens failed:", failedTokens);

            // Remove failed tokens from ALL users who have them
            await User.updateMany(
                { fcmTokens: { $in: failedTokens } },
                { $pull: { fcmTokens: { $in: failedTokens } } }
            );
            
            console.log(`🧹 Cleaned up ${failedTokens.length} failed tokens from database`);
        }

        return response;
    } catch (error) {
        console.error("❌ Error sending notifications:", error);
        throw error;
    }
};
