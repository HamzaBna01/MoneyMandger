"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2, UserPlus, Trash2, Wallet, Coins, Tags } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateHousehold,
  updateSavingsGoal,
  updateProfile,
  changePassword,
  inviteMember,
  updateMemberRole,
  removeMember,
  cancelInvite,
  type ActionState,
} from "@/app/(dashboard)/settings/actions";
import { useDict } from "@/components/i18n-provider";
import { fmt } from "@/lib/i18n/interpolate";

const ROLE_VALUES = ["OWNER", "MEMBER", "VIEWER"] as const;

export interface MemberView {
  membershipId: string;
  name: string;
  email: string;
  role: "OWNER" | "MEMBER" | "VIEWER";
  isSelf: boolean;
}
export interface InviteView {
  id: string;
  email: string;
  role: string;
}

function SaveButton({ label }: { label?: string }) {
  const { pending } = useFormStatus();
  const fallback = useDict().common.saveChanges;
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {label ?? fallback}
    </Button>
  );
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function SettingsClient({
  household,
  savingsGoal,
  profile,
  isOwner,
  members,
  invites,
}: {
  household: { name: string; baseCurrency: string };
  savingsGoal: { amount: string; deadline: string };
  profile: { name: string; email: string };
  isOwner: boolean;
  members: MemberView[];
  invites: InviteView[];
}) {
  const t = useDict().settings;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <HouseholdCard household={household} disabled={!isOwner} />
        <ProfileCard profile={profile} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChangePasswordCard />
      </div>

      <SavingsGoalCard goal={savingsGoal} disabled={!isOwner} />

      <MembersCard
        isOwner={isOwner}
        members={members}
        invites={invites}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t.accounts}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/accounts" />}>
            <Wallet className="size-4" />
            {t.manageAccounts}
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/categories" />}>
            <Tags className="size-4" />
            {t.manageCategories}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function HouseholdCard({
  household,
  disabled,
}: {
  household: { name: string; baseCurrency: string };
  disabled: boolean;
}) {
  const [state, action] = useActionState<ActionState, FormData>(updateHousehold, {});
  const t = useDict().settings;

  // Controlled so revalidation after a save can refresh the values without
  // tripping Base UI's "uncontrolled defaultValue changed" warning.
  const [name, setName] = useState(household.name);
  const [currency, setCurrency] = useState(household.baseCurrency);
  useEffect(() => {
    setName(household.name);
    setCurrency(household.baseCurrency);
  }, [household.name, household.baseCurrency]);

  useEffect(() => {
    if (state.message) toast.success(state.message);
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.household}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hh-name">{t.name}</Label>
            <Input
              id="hh-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={disabled}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hh-cur">{t.baseCurrency}</Label>
            <Input
              id="hh-cur"
              name="baseCurrency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={disabled}
              maxLength={8}
              required
            />
            <p className="text-xs text-muted-foreground">{t.baseCurrencyHint}</p>
          </div>
          {disabled ? (
            <p className="text-xs text-muted-foreground">{t.ownerOnly}</p>
          ) : (
            <SaveButton />
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function SavingsGoalCard({
  goal,
  disabled,
}: {
  goal: { amount: string; deadline: string };
  disabled: boolean;
}) {
  const [state, action] = useActionState<ActionState, FormData>(
    updateSavingsGoal,
    {}
  );
  const t = useDict().settings.savingsGoal;

  // Controlled so the values can be refreshed after a save (revalidate) without
  // tripping Base UI's "uncontrolled defaultValue changed" warning.
  const [amount, setAmount] = useState(goal.amount);
  const [deadline, setDeadline] = useState(goal.deadline);
  useEffect(() => {
    setAmount(goal.amount);
    setDeadline(goal.deadline);
  }, [goal.amount, goal.deadline]);

  useEffect(() => {
    if (state.message) toast.success(state.message);
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="size-5 text-primary" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sg-amount">{t.target}</Label>
              <Input
                id="sg-amount"
                name="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t.targetPlaceholder}
                inputMode="decimal"
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sg-deadline">{t.targetDate}</Label>
              <Input
                id="sg-deadline"
                name="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t.hint}</p>
          {disabled ? (
            <p className="text-xs text-muted-foreground">{t.ownerOnly}</p>
          ) : (
            <SaveButton label={t.save} />
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function ProfileCard({ profile }: { profile: { name: string; email: string } }) {
  const [state, action] = useActionState<ActionState, FormData>(updateProfile, {});
  const t = useDict().settings;

  // Controlled so a post-save revalidation can refresh the value cleanly.
  const [name, setName] = useState(profile.name);
  useEffect(() => setName(profile.name), [profile.name]);

  useEffect(() => {
    if (state.message) toast.success(state.message);
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.yourProfile}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-name">{t.name}</Label>
            <Input
              id="p-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-email">{t.email}</Label>
            <Input id="p-email" value={profile.email} disabled readOnly />
          </div>
          <SaveButton />
        </form>
      </CardContent>
    </Card>
  );
}

function ChangePasswordCard() {
  const [state, action] = useActionState<ActionState, FormData>(
    changePassword,
    {}
  );
  const t = useDict().settings;
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      toast.success(state.message);
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.password.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pw-current">{t.password.current}</Label>
            <Input
              id="pw-current"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw-new">{t.password.new}</Label>
            <Input
              id="pw-new"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw-confirm">{t.password.confirm}</Label>
            <Input
              id="pw-confirm"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">{t.password.hint}</p>
          <SaveButton label={t.password.save} />
        </form>
      </CardContent>
    </Card>
  );
}

function MembersCard({
  isOwner,
  members,
  invites,
}: {
  isOwner: boolean;
  members: MemberView[];
  invites: InviteView[];
}) {
  const [inviteState, inviteAction] = useActionState<ActionState, FormData>(
    inviteMember,
    {}
  );
  const [, startTransition] = useTransition();
  const dict = useDict();
  const t = dict.settings;

  useEffect(() => {
    if (inviteState.message) toast.success(inviteState.message);
    else if (inviteState.error) toast.error(inviteState.error);
  }, [inviteState]);

  function changeRole(id: string, role: "OWNER" | "MEMBER" | "VIEWER") {
    startTransition(async () => {
      const res = await updateMemberRole(id, role);
      if (res.ok) toast.success(t.toast.roleUpdated);
      else toast.error(res.error ?? dict.common.couldNotUpdate);
    });
  }
  function remove(id: string) {
    startTransition(async () => {
      const res = await removeMember(id);
      if (res.ok) toast.success(t.toast.memberRemoved);
      else toast.error(res.error ?? dict.common.couldNotRemove);
    });
  }
  function cancel(id: string) {
    startTransition(async () => {
      const res = await cancelInvite(id);
      if (res.ok) toast.success(t.toast.inviteCancelled);
      else toast.error(res.error ?? dict.common.couldNotCancel);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.members}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="divide-y">
          {members.map((m) => (
            <div key={m.membershipId} className="flex items-center gap-3 py-3 first:pt-0">
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary/15 text-xs font-medium text-primary">
                  {initials(m.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {m.name}
                  {m.isSelf && (
                    <span className="ms-2 text-xs text-muted-foreground">{t.you}</span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">{m.email}</p>
              </div>
              {isOwner ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={m.role}
                    onValueChange={(v) =>
                      changeRole(m.membershipId, v as "OWNER" | "MEMBER" | "VIEWER")
                    }
                    items={ROLE_VALUES.map((r) => ({ value: r, label: t.roles[r] }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_VALUES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {t.roles[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!m.isSelf && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t.removeMember}
                      onClick={() => remove(m.membershipId)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {t.roles[m.role]}
                </span>
              )}
            </div>
          ))}
        </div>

        {invites.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t.pendingInvites}
            </p>
            {invites.map((i) => (
              <div
                key={i.id}
                className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{i.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmt(t.awaitingSignup, {
                      role: t.roles[i.role as keyof typeof t.roles] ?? i.role,
                    })}
                  </p>
                </div>
                {isOwner && (
                  <Button variant="ghost" size="sm" onClick={() => cancel(i.id)}>
                    {dict.common.cancel}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {isOwner && (
          <form action={inviteAction} className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium">{t.inviteByEmail}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                name="email"
                type="email"
                placeholder={t.invitePlaceholder}
                required
                className="flex-1"
              />
              <RoleSelect />
              <InviteButton />
            </div>
            <p className="text-xs text-muted-foreground">{t.inviteHint}</p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function RoleSelect() {
  const [role, setRole] = useState("MEMBER");
  const roles = useDict().settings.roles;
  return (
    <>
      <input type="hidden" name="role" value={role} />
      <Select
        value={role}
        onValueChange={(v) => setRole(v as string)}
        items={ROLE_VALUES.map((r) => ({ value: r, label: roles[r] }))}
      >
        <SelectTrigger className="w-full sm:w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLE_VALUES.map((r) => (
            <SelectItem key={r} value={r}>
              {roles[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

function InviteButton() {
  const { pending } = useFormStatus();
  const t = useDict().settings;
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
      {t.invite}
    </Button>
  );
}
