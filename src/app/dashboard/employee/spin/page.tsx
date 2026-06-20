import { redirect } from "next/navigation";
import { getMembership } from "@/lib/account";
import { getSpinState } from "@/lib/spin";
import { SpinWheel } from "./SpinWheel";

export const dynamic = "force-dynamic";

export default async function SpinPage() {
  const m = await getMembership();
  if (!m) redirect("/onboarding");
  const { spunToday, streak } = await getSpinState(m.id);
  return <SpinWheel balance={m.recognitionCoins} spunToday={spunToday} streak={streak} />;
}
