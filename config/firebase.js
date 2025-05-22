{/*import admin  from 'firebase-admin'
//import serviceAccount from "./firebase-adminsdk.json" assert { type: 'json' }
import { readFileSync } from 'fs';
const serviceAccount = JSON.parse(readFileSync('./config/firebase-adminsdk.json'));
admin.initializeApp({
    credential: admin.credential.cert({
        serviceAccount,
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
export default admin*/}


{/*import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./config/firebase-adminsdk.json'));

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key
  }),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

export default admin;*/}

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Load service account
const serviceAccount = JSON.parse(readFileSync('./config/firebase-adminsdk.json'));

// Properly handle escaped newlines in private key
if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

export default admin;