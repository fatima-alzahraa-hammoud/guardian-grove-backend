import admin from "firebase-admin";

const serviceAccount = require('./firebaseAdminSDK.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export const firebaseAdmin = admin;