"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getWorkspaces, WS_COOKIE, WS_HOME, type Workspace } from "./account";

/** Switch the active workspace (verified against the user's real capabilities) and land there. */
export async function switchWorkspace(ws: Workspace): Promise<void> {
  const w = await getWorkspaces();
  if (!w || !w.available.includes(ws)) redirect("/dashboard");
  (await cookies()).set(WS_COOKIE, ws, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect(WS_HOME[ws]);
}
