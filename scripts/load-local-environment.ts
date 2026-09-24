import { config } from "dotenv";

// CLI scripts run outside Next.js, so load its local override explicitly.
config({ path: ".env.local", quiet: true });
config({ quiet: true });
