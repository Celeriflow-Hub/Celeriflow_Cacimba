export type FirebaseUserProvisioningInput = {
  email: string;
  displayName: string;
  disabled: boolean;
  firebaseUid?: string | null;
};

export type FirebaseAuthUserAdapter = {
  getUser(uid: string): Promise<{ uid: string }>;
  getUserByEmail(email: string): Promise<{ uid: string }>;
  createUser(input: { email: string; displayName: string; disabled: boolean }): Promise<{ uid: string }>;
  updateUser(uid: string, input: { email: string; displayName: string; disabled: boolean }): Promise<{ uid: string }>;
};

function isUserNotFound(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "auth/user-not-found";
}

export function createFirebaseUserProvisioner(auth: FirebaseAuthUserAdapter) {
  return {
    async provision(input: FirebaseUserProvisioningInput) {
      const email = input.email.trim().toLowerCase();
      if (!email) throw new Error("O e-mail é obrigatório para provisionar a credencial Firebase.");
      if (input.firebaseUid) {
        const user = await auth.updateUser(input.firebaseUid, { email, displayName: input.displayName, disabled: input.disabled });
        return { firebaseUid: user.uid };
      }
      try {
        const existing = await auth.getUserByEmail(email);
        const user = await auth.updateUser(existing.uid, { email, displayName: input.displayName, disabled: input.disabled });
        return { firebaseUid: user.uid };
      } catch (error) {
        if (!isUserNotFound(error)) throw error;
      }
      const user = await auth.createUser({ email, displayName: input.displayName, disabled: input.disabled });
      return { firebaseUid: user.uid };
    },
  };
}
