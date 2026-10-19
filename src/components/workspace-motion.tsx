"use client";
import { motion, MotionConfig } from "motion/react";
import { usePathname } from "next/navigation";
export function WorkspaceMotion({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <MotionConfig reducedMotion="user"><motion.div className="workspace-transition" key={pathname} initial={{ y: 6 }} animate={{ y: 0 }} transition={{ duration: 0.16 }}>{children}</motion.div></MotionConfig>;
}
