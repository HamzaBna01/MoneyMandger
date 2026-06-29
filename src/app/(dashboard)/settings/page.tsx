import { format } from "date-fns";
import { requireHousehold } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { centsToInput } from "@/lib/money";
import { SettingsClient, type MemberView } from "@/components/settings-client";

export default async function SettingsPage() {
  const { householdId, household, userId, role } = await requireHousehold();

  const [memberships, invites] = await Promise.all([
    prisma.membership.findMany({
      where: { householdId },
      include: { user: true },
      orderBy: { role: "asc" },
    }),
    prisma.invite.findMany({
      where: { householdId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const self = memberships.find((m) => m.userId === userId);

  const members: MemberView[] = memberships.map((m) => ({
    membershipId: m.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role as "OWNER" | "MEMBER" | "VIEWER",
    isSelf: m.userId === userId,
  }));

  return (
    <SettingsClient
      household={{ name: household.name, baseCurrency: household.baseCurrency }}
      savingsGoal={{
        amount: household.savingsMonthlyCents != null ? centsToInput(household.savingsMonthlyCents) : "",
        deadline: household.savingsGoalDeadline
          ? format(household.savingsGoalDeadline, "yyyy-MM-dd")
          : "",
      }}
      profile={{ name: self?.user.name ?? "", email: self?.user.email ?? "" }}
      isOwner={role === "OWNER"}
      members={members}
      invites={invites.map((i) => ({ id: i.id, email: i.email, role: i.role }))}
    />
  );
}
