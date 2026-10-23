import { requireViewer } from "@/lib/auth";
import { Shell } from "@/components/shell";
import { PortfolioViewport } from "@/components/portfolio-viewport";

// Keep the staff frame mounted while only the selected portfolio changes.
export default async function PortfolioLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireViewer();
  return <Shell profile={profile} framed current="classes"><PortfolioViewport>{children}</PortfolioViewport></Shell>;
}
