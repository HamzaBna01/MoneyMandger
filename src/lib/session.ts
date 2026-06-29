import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";

/** Returns the session or redirects to /login. Use in server components/actions. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
}

/**
 * Returns the logged-in user's household (with their membership/role) or
 * redirects to login. Every data query in the app should be scoped via the
 * returned householdId.
 */
export async function requireHousehold() {
  const session = await requireSession();
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { household: true },
  });
  if (!membership) redirect("/login");
  return {
    userId: session.user.id,
    userName: session.user.name ?? "",
    userEmail: session.user.email ?? "",
    householdId: membership.householdId,
    household: membership.household,
    role: membership.role,
  };
}

/** True when the role is allowed to mutate data (everyone except VIEWER). */
export function canWrite(role: string): boolean {
  return role === "OWNER" || role === "MEMBER";
}
