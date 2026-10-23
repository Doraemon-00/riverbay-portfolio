import { requireViewer } from "@/lib/auth";
import { Shell } from "@/components/shell";

// One frame for My classes, portfolios and Administration: it stays mounted while only the page changes.
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireViewer();
  return <Shell profile={profile}>{children}</Shell>;
}
