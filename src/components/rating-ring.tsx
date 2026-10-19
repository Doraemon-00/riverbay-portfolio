import Image from "next/image";
const files = ["unassessed", "beginning", "developing", "consistently-shown"];
export function RatingRing({ level }: { level: number | null }) {
  return <Image className="rating-ring" src={`/assets/riverbay/ring-${files[level ?? 0]}.svg`} width={64} height={64} alt="" />;
}
