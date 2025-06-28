import admin from "firebase-admin";

let serviceAccount;

if(process.env.NODE_ENV !== 'production') { 
    serviceAccount = require('./firebaseAdminSDK.json');
} else {
    serviceAccount = require('/etc/secrets/firebaseAdminSDK.json');
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export const firebaseAdmin = admin;