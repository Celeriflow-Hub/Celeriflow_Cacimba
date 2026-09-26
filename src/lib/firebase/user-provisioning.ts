export type FirebaseUserProvisioningInput = {
  email: string;
  displayName: string;
  disabled: boolean;
  firebaseUid?: string | null;
  password?: string;
};

type FirebaseUserMutation = {
  email: string;
  displayName: string;
  disabled: boolean;
  emailVerified: boolean;
  password?: string;
};

export type FirebaseAuthUserAdapter = {
  getUser(uid: string): Promise<{ uid: string }>;
  getUserByEmail(email: string): Promise<{ uid: string }>;
  createUser(input: FirebaseUserMutation): Promise<{ uid: string }>;
  updateUser(uid: string, input: FirebaseUserMutation): Promise<{ uid: string }>;
};

function isUserNotFound(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "auth/user-not-found";
}

export function isStrongFirebasePassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

export function createFirebaseUserProvisioner(auth: FirebaseAuthUserAdapter) {
  return {
    async provision(input: FirebaseUserProvisioningInput) {
      const email = input.email.trim().toLowerCase();
      if (!email) throw new Error("O e-mail é obrigatório para provisionar a credencial Firebase.");
      const userData: FirebaseUserMutation = {
        email,
        displayName: input.displayName,
        disabled: input.disabled,
        emailVerified: true,
        ...(input.password ? { password: input.password } : {}),
      };
      if (input.firebaseUid) {
        const user = await auth.updateUser(input.firebaseUid, userData);
        return { firebaseUid: user.uid };
      }
      try {
        const existing = await auth.getUserByEmail(email);
        const user = await auth.updateUser(existing.uid, userData);
        return { firebaseUid: user.uid };
      } catch (error) {
        if (!isUserNotFound(error)) throw error;
      }
      const user = await auth.createUser(userData);
      return { firebaseUid: user.uid };
    },
  };
}
