import { redirect } from "next/navigation";

// The system and Vercel hosts rewrite the public route to app-domain before
// rendering. This fallback keeps alternate hosts on the same canonical portal
// surface instead of maintaining a second, RH-authorized implementation.
export default function LegacyPortalServidorRoute() {
  redirect("/app-domain/portal-servidor");
}
