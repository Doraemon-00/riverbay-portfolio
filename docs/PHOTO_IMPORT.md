# Domain photo import

Implemented 20 October 2026. Fictional demonstration content only. No PDF placement/export or AI image analysis is implemented by this step.

## Teacher flow

Each portfolio domain now has a Photos section matching the existing editor theme:

- **Upload images** accepts multiple JPG, PNG or WebP files, up to 10 files per selection and 10 MB per original file. Ten is a batch limit, not a required portfolio count.
- **Add placeholder** creates one neutral labelled sample image without local file selection. It contains no real child, brand illustration or generated artwork. Both placeholders and selected files use the same image preparation/storage pipeline.
- A thumbnail opens an uncropped larger preview. Remove opens a confirmation and removes the attachment plus its storage object when cleanup succeeds.
- The displayed count belongs to the current child's current semester and domain, via its domain entry ID. Navigating to another domain does not copy images.
- Photos save immediately, **separately from notes/rating/narrative Save changes**. No router refresh or narrative save is triggered. Existing unsaved-writing navigation protection remains in place.
- During file operations, app link/custom navigation is blocked briefly and reload/close uses the browser's native warning. Browser-history interruption is not a universal guarantee.
- Batch uploads are sequential. On failure, already completed images remain saved and the message reports that partial success. No automatic retry duplicates an attachment.

## Storage and image preparation

Uses the existing `photos` table and private `portfolio-photos` bucket; no schema migration was needed. The browser client uses the public Supabase key and authenticated session, **not a service-role key**. Existing database and storage row-level policies enforce class/portfolio access.

Original uploads are decoded and re-encoded as JPEG (quality 0.85), maximum longest edge 1600 px without upscaling. Transparent areas become white. Original EXIF payload is not copied. The prototype stores this prepared image, not an additional byte-for-byte original. A production requirement to retain originals would need an explicit second object/reference and retention policy.

Objects use `<entry UUID>/image-<random UUID>.jpg` or `demo-<random UUID>.jpg`. Original filenames are not used in storage keys. Upload goes directly from the browser to Supabase Storage, avoiding a Vercel Function upload-body limit. Metadata stores the entry reference, storage key, upload actor and display position; image bytes are not database rows. New positions follow existing positions; manual reordering is not implemented.

Photo reads request one-hour signed URLs after access checks. The bucket is not public, but a signed URL is a temporary bearer link; it should not be shared. Access revocation does not necessarily invalidate a previously issued signed link immediately. Refreshing the page fetches fresh links; automatic renewal during a very long open session remains future work. Images are not forwarded to the narrative model.

Database insert failure attempts to remove its unattached uploaded object. Removal first deletes the metadata row, then removes the file. These are not a cross-service transaction: a storage cleanup failure is reported and can leave a private orphan for administrator cleanup. Production cleanup jobs, durable upload audit/history and stronger storage accounting are deferred.

## Verification

- Lint, TypeScript checking and production build passed.
- Extended local access checks passed: authorised photo metadata insert/read/delete, signed preview, cross-teacher metadata isolation, denial of unassigned teacher metadata insert/signed URL access, anonymous read denial, and SVG MIME rejection. Disposable test fixtures were cleaned up.
- Browser checks passed: placeholder creation through PNG decode/JPEG re-encoding, signed image decoding at 1200×800, preview dialog, removal confirmation, reload persistence, domain isolation, unchanged Save changes state after photo actions, preservation of unsaved narrative edits while adding/removing photos, and discard restoring the persisted narrative.
- Desktop and 390px layouts inspected, with no horizontal overflow. Screenshots: `verification/photos-desktop.png` and `verification/photos-mobile.png`.
- Two sample placeholders remain in Avery Lim's English domain. His saved narrative/observations/rating were not changed.
- **Local multi-file chooser automation could not complete:** the Chrome extension requires its optional file-URL access permission. That setting was not changed. The browser picker was opened, but selection of local files through automation remains unverified. Private storage operations and the shared preparation path were exercised independently as described above; an ordinary manual upload should still be checked.

## Next steps

Captions, manual reordering, cropping/replacement and PDF layout are not part of this import step. The existing caption column remains available for the future PDF flow. No selected files were added to `public/assets/`, no cloud deployment or sharing/credential changes were made, and no commit was created.

## Image removal dialog polish — 22 October 2026

Keep image and Remove image now share secondary-button sizing, padding and rounded corners. Both use transparent borders; Keep image has mint hover/focus, while Remove image has red text on a transparent background and a soft red box only on hover or keyboard focus. Scoped to the image confirmation dialog.

Verified desktop and 390px layout, keyboard focus styling, and Keep image closing the dialog with both existing images retained. No image was deleted. Lint passed with seven existing PDF-concept warnings; typecheck and production build passed. Screenshots: verification/photo-remove-buttons-desktop.png and verification/photo-remove-buttons-mobile.png. No commit or deployment.
