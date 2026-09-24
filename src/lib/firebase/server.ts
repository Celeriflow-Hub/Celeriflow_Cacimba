import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID as string,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
        // Replace escaped newline characters and strip quotes if any
        privateKey: (process.env.FIREBASE_PRIVATE_KEY as string)
          ?.replace(/^"|"$/g, "")
          ?.replace(/\\n/g, "\n"),
      }),
    });
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
}

export const adminAuth = getAuth();

