import Image from "next/image";

// "Perx" — the mascot character. Each mood maps to an illustrated render in /public/perx/characters.
const MOODS: Record<string, string> = {
  happy: "perx-mood-charged", charged: "perx-mood-charged",
  celebrate: "perx-mood-celebrate", cheer: "perx-mood-celebrate",
  thinking: "perx-mood-thinking", think: "perx-mood-thinking",
  cool: "perx-mood-cool", wink: "perx-mood-cool",
  sleepy: "perx-mood-sleepy", sleep: "perx-mood-sleepy",
  excited: "perx-mood-excited", surprised: "perx-mood-surprised",
  low: "perx-mood-lowbattery", lowbattery: "perx-mood-lowbattery", tired: "perx-mood-lowbattery",
  charging: "perx-mood-charging", holding: "perx-mascot-holding-pack", pack: "perx-mascot-holding-pack",
  love: "perx-sister-e-hearteyes", hearteyes: "perx-sister-e-hearteyes",
};

export function Mascot({ mood = "charged", size = 72, className = "" }: { mood?: string; size?: number; className?: string }) {
  const file = MOODS[mood] ?? "perx-mood-charged";
  return (
    <Image
      src={`/perx/characters/${file}.png`}
      alt="Perx"
      width={size}
      height={size}
      className={`mascot-img ${className}`}
      unoptimized
    />
  );
}
