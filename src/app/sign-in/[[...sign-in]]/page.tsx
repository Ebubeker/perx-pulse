import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <SignIn />
    </div>
  );
}
