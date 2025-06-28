import admin from "firebase-admin";

const serviceAccount = process.env.NODE_ENV !== 'production' 
    ? require('./firebaseAdminSDK.json') 
    : require('/etc/secrets/firebaseAdminSDK.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export const firebaseAdmin = admin;