#!/usr/bin/env node

const admin = require("firebase-admin");

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  console.error("Missing GOOGLE_APPLICATION_CREDENTIALS env var.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const [, , uid, flag] = process.argv;
if (!uid) {
  console.error("Usage: node set-admin-claim.js <uid> [true|false]");
  process.exit(1);
}

const isAdmin = flag !== "false";

admin
  .auth()
  .setCustomUserClaims(uid, { admin: isAdmin })
  .then(() => {
    console.log(`Admin claim set to ${isAdmin} for uid ${uid}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Failed to set admin claim:", err);
    process.exit(1);
  });
