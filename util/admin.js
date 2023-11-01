var admin = require("firebase-admin");

var serviceAccount = require("../rusticoslanus-84470-firebase-adminsdk-gx78g-662ad68c47.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
module.exports = { admin, db };