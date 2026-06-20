import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getT } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");
  const { t, locale } = await getT();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 text-center">
      <div className="absolute right-5 top-5">
        <LocaleSwitcher current={locale} />
      </div>
      <div>
        <h1 className="text-3xl font-bold">Perx Pulse</h1>
        <p className="mt-1 text-muted">{t("landing.tagline")}</p>
        <p className="mx-auto mt-3 max-w-xs text-sm text-muted">{t("landing.sub")}</p>
      </div>
      <div className="flex flex-col gap-3">
        <Link href="/sign-up" className="rounded-lg bg-primary px-4 py-3 font-semibold text-white">
          {t("landing.create")}
        </Link>
        <Link href="/sign-in" className="rounded-lg border border-line px-4 py-3 font-semibold">
          {t("landing.signin")}
        </Link>
      </div>
    </main>
  );
}
