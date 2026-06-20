"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale } from "./i18n";

export async function setLocale(locale: Locale): Promise<void> {
  const c = await cookies();
  c.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
