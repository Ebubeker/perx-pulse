import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";

export default function Page() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-cream px-6 py-10">
      <div className="flex flex-col items-center text-center">
        <Mascot mood="charged" size={96} className="float" />
        <Logo className="mt-4" />
        <p className="mt-3 max-w-xs text-[15px] text-muted">Your perks, your coins — welcome back to Perx Pulse.</p>
      </div>
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#EC6A4D",
            borderRadius: "14px",
            fontFamily: "var(--f-body)",
          },
          elements: {
            rootBox: "w-full max-w-[400px]",
            card: "shadow-soft border border-line rounded-[26px]",
            headerTitle: "font-display",
            formButtonPrimary: "font-semibold normal-case text-[15px]",
          },
        }}
      />
    </main>
  );
}
