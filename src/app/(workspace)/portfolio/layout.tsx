import { PortfolioViewport } from "@/components/portfolio-viewport";

// The workspace frame stays mounted above; this keeps the portfolio area's height while only the selected portfolio changes.
export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <PortfolioViewport>{children}</PortfolioViewport>;
}
