var admin = require("firebase-admin");

var serviceAccount = require("../api-superprof-firebase-adminsdk-5d9cn-0496c36f8f.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
module.exports = { admin, db };