// Minimal headless-Chrome driver over the DevTools protocol.
// Dependency-free: uses Node 22's built-in WebSocket and child_process.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

export function findChrome() {
  const found = CANDIDATES.find((p) => existsSync(p));
  if (!found) throw new Error("No Chrome/Chromium found. Set CHROME_PATH to a Chromium-based browser executable.");
  return found;
}

// Serverless hosts supply a bundled headless Chromium and the flags it needs as a JSON array
// (set by the app's export adapter); those flags include their own headless mode.
const HOST_ARGS = process.env.CHROME_ARGS ? JSON.parse(process.env.CHROME_ARGS) : null;

export async function launch() {
  const executable = findChrome();
  const profile = mkdtempSync(join(tmpdir(), "riverbay-pdf-"));
  const proc = spawn(
    executable,
    [
      ...(HOST_ARGS ?? ["--headless=new"]),
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-sync",
      "--font-render-hinting=none",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  const portFile = join(profile, "DevToolsActivePort");
  let wsPath;
  for (let i = 0; i < 200 && !wsPath; i++) {
    await delay(50);
    if (existsSync(portFile)) {
      const [port, path] = readFileSync(portFile, "utf8").trim().split("\n");
      if (port && path) wsPath = `ws://127.0.0.1:${port}${path}`;
    }
  }
  if (!wsPath) throw new Error("Chrome did not expose a DevTools port");
  const browser = await connect(wsPath);
  const version = await browser.send("Browser.getVersion");
  return {
    browser,
    version,
    executable,
    async close() {
      try {
        await browser.send("Browser.close");
      } catch {}
      browser.ws.close();
      for (let i = 0; i < 40; i++) {
        try {
          rmSync(profile, { recursive: true, force: true });
          break;
        } catch {
          await delay(100);
        }
      }
    },
  };
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let nextId = 1;
    const pending = new Map();
    const listeners = new Set();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { ok, fail } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? fail(new Error(`${msg.error.message} ${msg.error.data ?? ""}`)) : ok(msg.result);
      } else if (msg.method) {
        for (const fn of listeners) fn(msg);
      }
    };
    ws.onerror = () => reject(new Error("DevTools connection failed"));
    ws.onopen = () =>
      resolve({
        ws,
        send(method, params = {}, sessionId) {
          const id = nextId++;
          ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
          return new Promise((ok, fail) => pending.set(id, { ok, fail }));
        },
        on(fn) {
          listeners.add(fn);
          return () => listeners.delete(fn);
        },
      });
  });
}

// Open a page target and return a session-scoped helper.
export async function openPage(browser) {
  const { targetId } = await browser.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await browser.send("Target.attachToTarget", { targetId, flatten: true });
  const send = (method, params) => browser.send(method, params, sessionId);
  const requests = [];
  const consoleMessages = [];
  browser.on((msg) => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === "Network.requestWillBeSent") requests.push(msg.params.request.url);
    if (msg.method === "Runtime.consoleAPICalled")
      consoleMessages.push(msg.params.args.map((a) => a.value ?? a.description).join(" "));
    if (msg.method === "Runtime.exceptionThrown") consoleMessages.push("EXCEPTION " + msg.params.exceptionDetails.exception?.description);
  });
  await send("Network.enable");
  await send("Runtime.enable");
  await send("Page.enable");
  return {
    send,
    requests,
    consoleMessages,
    async goto(url) {
      await send("Page.navigate", { url });
    },
    async evaluate(expression) {
      const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
      return r.result.value;
    },
    async close() {
      await browser.send("Target.closeTarget", { targetId });
    },
  };
}
