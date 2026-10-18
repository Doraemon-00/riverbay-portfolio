import { spawnSync } from "node:child_process";
// Capture CLI output because it includes local API credentials on success.
const result = spawnSync(
  process.execPath,
  ["node_modules/supabase/dist/supabase.js", "start"],
  {
    stdio: ["inherit", "pipe", "inherit"],
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  },
);
if (result.status !== 0) {
  console.error(
    "Local database startup failed. Check Docker is running and ports 54321–54324 are available.",
  );
  process.exit(result.status ?? 1);
}
console.log(
  "Local Supabase stack ready. Run npm run setup:local to configure the app.",
);
