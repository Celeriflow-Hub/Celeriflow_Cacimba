import { adminAuth } from "@/lib/firebase/server";

export const SESSION_COOKIE_NAME = "celeriflow_session";
export const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

export type SessionPrincipal = {
  firebaseUid: string;
  email: string;
  name: string;
  authTime: number;
};

export async function createSession(idToken: string) {
  return adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_DURATION_MS });
}

export async function getSessionPrincipal(sessionCookie: string | undefined): Promise<SessionPrincipal | null> {
  if (!sessionCookie) return null;

  try {
    const token = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (!token.email || token.email_verified !== true) return null;

    return {
      firebaseUid: token.uid,
      email: token.email.toLowerCase(),
      name: token.name ?? token.email,
      authTime: token.auth_time,
    };
  } catch {
    return null;
  }
}

export async function getIdTokenPrincipal(idToken: string): Promise<SessionPrincipal | null> {
  try {
    const token = await adminAuth.verifyIdToken(idToken);
    if (!token.email || token.email_verified !== true) return null;

    return {
      firebaseUid: token.uid,
      email: token.email.toLowerCase(),
      name: token.name ?? token.email,
      authTime: token.auth_time,
    };
  } catch {
    return null;
  }
}
