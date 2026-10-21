# Full-window sign-in trial — 19 October 2026

Implemented using the supplied UI/UX Pro Max and UI Design System guidance with existing Riverbay tokens. The UI/UX Pro Max search helper is absent from its installed skill folder; written guidance was used. No new token palette or illustration was generated.

- Same artwork now fills the backdrop area; foreground paper form on the right. Desktop contains the image; mobile crops it and softens the background.
- Desktop and 390px browser inspection completed; short landscape orientation checked for normal document scrolling rather than clipped fixed-height form.
- No horizontal overflow at 390px. Input text 16px; visible inputs approximately 49px tall; submit button 46px.
- Keyboard Tab moves from email to password with a visible focus ring. Labels and original server action remain intact. No authentication changes.
- Calculated contrast: ink/paper 11.73:1; muted/paper 5.45:1; white/primary 7.61:1. Form surface is a near-opaque cream with white inputs.
- Lint, typecheck and production build pass.
- Existing reduced-motion overrides retained; OS preference switching, large text emulation and dark mode were not tested in this pass.
- Quick tour unchanged. No commit, push or deployment.

Screenshots: signin-full-desktop.png; signin-full-mobile.png. Final art placement remains open for feedback.
