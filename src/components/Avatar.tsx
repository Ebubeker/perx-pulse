import Image from "next/image";

// The design gives every coworker their own illustrated "Pulse" character.
// Pick one of the five stably from the person's name/id (the .char-av pattern).
const SISTERS = [
  "perx-sister-a-antenna",
  "perx-sister-b-eartabs",
  "perx-sister-c-headphones",
  "perx-sister-d-bow",
  "perx-sister-e-hearteyes",
];

function pickSister(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return SISTERS[h % SISTERS.length]!;
}

export function Avatar({
  name,
  seed,
  size = 38,
  className = "",
}: {
  name?: string;
  seed?: string;
  size?: number;
  className?: string;
}) {
  const file = pickSister(seed ?? name ?? "perx");
  return (
    <span className={`char-av inline-grid place-items-center rounded-full ${className}`} style={{ width: size, height: size }}>
      <Image src={`/perx/characters/${file}.png`} alt={name ?? "Member"} width={size} height={size} unoptimized />
    </span>
  );
}
