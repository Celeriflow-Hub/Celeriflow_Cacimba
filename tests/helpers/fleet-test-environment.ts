import { generateKeyPairSync } from "node:crypto";

// Runs before domain imports in this test worker. No real account or database is used.
const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});
process.env.DATABASE_URL = "postgresql://fixture:fixture@127.0.0.1:1/fleet_fixture";
process.env.FIREBASE_PROJECT_ID = "fleet-fixture";
process.env.FIREBASE_CLIENT_EMAIL = "fixture@fleet-fixture.iam.gserviceaccount.com";
process.env.FIREBASE_PRIVATE_KEY = privateKey;
