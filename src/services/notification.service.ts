import { firebaseAdmin } from "../utils/firebase/firebase";

interface NotificationPayload {
    token: string;
    title: string;
    body: string;
    data?: Record<string, string>;
}

export const createNotification = async ({ token, title, body, data = {},}: NotificationPayload) => {
    const message = {
        notification: {
            title,
            body,
        },
        data,
        token,
    };

    return await firebaseAdmin.messaging().send(message);
};
