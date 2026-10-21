import Image from "next/image";
import { domainReadiness } from "@/lib/domain-readiness";

const animals: Record<string, string> = {
  english: "beaver", chinese: "rabbit", mathematics: "squirrel", social_emotional: "bear",
};

export function DomainStamp({ domain, hasIndicator, hasStory, tooltipId }: {
  domain: string; hasIndicator: boolean; hasStory: boolean; tooltipId: string;
}) {
  const { description } = domainReadiness(hasIndicator, hasStory);
  return <>
    <span className={`domain-stamp${hasIndicator ? " has-indicator" : ""}`} aria-hidden="true">
      {hasStory && <Image src={`/assets/riverbay/stamp-${animals[domain]}.webp`} alt="" width={36} height={36} />}
    </span>
    <span className="domain-readiness-tooltip" id={tooltipId} role="tooltip">{description}</span>
  </>;
}
