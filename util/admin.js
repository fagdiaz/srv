var admin = require("firebase-admin");

var serviceAccount = require("../rusticoslanus-84470-firebase-adminsdk-gx78g-662ad68c47.json");

// Para desarrollo/pruebas: si FIRESTORE_EMULATOR_HOST o USE_FIRESTORE_EMULATOR estan definidos,
// el cliente apuntara al emulador (ej: FIRESTORE_EMULATOR_HOST=localhost:8080).
var emulatorHost =
  process.env.FIRESTORE_EMULATOR_HOST ||
  (process.env.USE_FIRESTORE_EMULATOR === "true" ? "localhost:8080" : "");
if (emulatorHost) {
  process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
module.exports = { admin, db };
