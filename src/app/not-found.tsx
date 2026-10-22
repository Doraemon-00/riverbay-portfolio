import Link from "next/link";
import { QuickTour } from "@/components/quick-tour";

export default function NotFound() {
  return <section className="panel recovery-panel" data-tour-page="unavailable">
    <p className="eyebrow">RIVERBAY</p><h1>This page isn’t available.</h1>
    <p>The link may have changed, or this portfolio may not be available to your account. Return to your classes to choose an accessible portfolio.</p>
    <div className="recovery-actions"><Link className="primary button" href="/">Back to my classes</Link><QuickTour inline /></div>
  </section>;
}
