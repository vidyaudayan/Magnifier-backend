import admin  from 'firebase-admin'
import serviceAccount from "./firebase-adminsdk.json" assert { type: 'json' }

admin.initializeApp({
    credential: admin.credential.cert({
        serviceAccount,
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
export default admin