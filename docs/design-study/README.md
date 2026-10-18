# Earlier static design study

Historical visual reference, separate from the working Next.js application at the repository root. Uses fictional data, browser-local saving and fixed sample text. No backend, real AI, upload or actual PDF service is connected in this study. The selected Riverbay animal/floral artwork is not implemented here.

From the repository root:

```powershell
python -m http.server 8766 --bind 127.0.0.1 --directory docs/design-study
```

Open http://127.0.0.1:8766/. Regenerate bundled assets with `python docs/design-study/prepare_assets.py`; the script downloads pinned public font/icon packages and verifies their integrity. Licenses are in assets/. Local reference screenshots are excluded from Git.

For the actual application, use the root README and `npm run dev` (port 3000).
