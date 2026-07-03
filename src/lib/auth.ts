import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma } from "./prisma";
import { loginSchema } from "./validations";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { memberships: { take: 1 } },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        const membership = user.memberships[0];
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          householdId: membership?.householdId ?? null,
          role: membership?.role ?? null,
        };
      },
    }),
  ],
  // Audit trail: record every successful sign-in and sign-out. These run in the
  // node runtime (this file), so prisma is available here — unlike auth.config.
  events: {
    async signIn({ user }) {
      if (user?.id && user.email) {
        await prisma.authEvent.create({
          data: { userId: user.id, email: user.email, type: "LOGIN" },
        });
      }
    },
    async signOut(message) {
      const token = "token" in message ? message.token : undefined;
      const id = token?.id;
      if (typeof id !== "string") return;

      // The JWT normally carries the email; fall back to a lookup if it doesn't.
      const email =
        typeof token?.email === "string"
          ? token.email
          : (
              await prisma.user.findUnique({
                where: { id },
                select: { email: true },
              })
            )?.email;
      if (!email) return;

      await prisma.authEvent.create({
        data: { userId: id, email, type: "LOGOUT" },
      });
    },
  },
});
