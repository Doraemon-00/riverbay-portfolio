"use client";
import { motion, MotionConfig } from "motion/react";

export function WorkspaceMotion({ children }: { children: React.ReactNode }) {

  return <MotionConfig reducedMotion="user"><motion.div className="workspace-transition" initial={{ y: 6 }} animate={{ y: 0 }} transition={{ duration: 0.16 }}>{children}</motion.div></MotionConfig>;
}
