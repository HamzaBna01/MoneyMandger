import { NextResponse } from "next/server";
import { materializeDueRules } from "@/lib/recurring";

// Materialize all due recurring rules across every household.
// Call manually (GET /api/cron/recurring) or wire to a scheduler later.
// If CRON_SECRET is set, require it via ?secret= or the Authorization header.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(request.url);
    const provided =
      url.searchParams.get("secret") ??
      request.headers.get("authorization")?.replace("Bearer ", "");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await materializeDueRules();
  return NextResponse.json({ ok: true, ...result });
}
