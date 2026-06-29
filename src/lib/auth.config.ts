import type { NextAuthConfig } from "next-auth";

// Edge-safe config: NO database / bcrypt imports here so it can run in the
// middleware (edge) runtime. The Credentials provider with its prisma-backed
// `authorize` lives in auth.ts (node runtime) only.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [], // populated in auth.ts
  callbacks: {
    // Carry household + role onto the token at sign-in, then expose on session.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.householdId = (user.householdId ?? "") as string;
        token.role = (user.role ?? "") as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.householdId = token.householdId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
