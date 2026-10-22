"use client";
/* eslint-disable @next/next/no-img-element -- Private short-lived storage URLs; avoid routing originals through the image optimiser. */
import { useEffect, useRef, useState } from "react";
import { browserDatabase } from "@/lib/supabase/browser";
import { placeholderPhoto, preparePhoto } from "@/lib/photo-files";
import { Dialog } from "./admin-workspace";
import { Icon } from "./icon";

type Photo = { id: string; storage_key: string; caption: string; position: number; url: string | null };
const bucket = "portfolio-photos";

export function DomainPhotos({ entryId, domainLabel }: { entryId: string; domainLabel: string }) {
  const [db] = useState(browserDatabase);
  const [photos, setPhotos] = useState<Photo[]>([]);
  // Easter egg: one photo hides a squirrel that peeks over its top edge on hover. A fresh random draw on
  // every visit; scaling it by the current count lets the egg move when photos are added or removed.
  const [eggDraw] = useState(Math.random);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [remove, setRemove] = useState<Photo | null>(null);
  const [preview, setPreview] = useState<Photo | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const lock = useRef(false);

  async function readPhotos() {
    const { data, error } = await db.from("photos").select("id,storage_key,caption,position").eq("entry_id", entryId).order("position").order("created_at").order("id");
    if (error) throw new Error("Could not load photos. Try again.");
    if (!data.length) return [];
    const signed = await db.storage.from(bucket).createSignedUrls(data.map(p => p.storage_key), 3600);
    if (signed.error) throw new Error("Could not load photo previews. Try again.");
    return data.map(p => ({ ...p, url: signed.data.find(s => s.path === p.storage_key)?.signedUrl ?? null }));
  }
  useEffect(() => {
    let active = true;
    readPhotos().then(items => { if (active) setPhotos(items); }).catch(() => { if (active) { setFailed(true); setMessage("Could not load photos. Try again."); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // This component is keyed by its parent domain entry; no route-wide refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId, db]);

  useEffect(() => {
    if (!busy) return;
    const unload = (event: BeforeUnloadEvent) => event.preventDefault();
    const navigate = (event: Event) => {
      if (event instanceof MouseEvent && (!(event.target instanceof Element) || !event.target.closest("a[href]"))) return;
      event.preventDefault(); event.stopImmediatePropagation();
      setMessage("Please wait for the photo operation to finish before navigating.");
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("click", navigate, true);
    window.addEventListener("riverbay:before-navigate", navigate, true);
    return () => { window.removeEventListener("beforeunload", unload); window.removeEventListener("click", navigate, true); window.removeEventListener("riverbay:before-navigate", navigate, true); };
  }, [busy]);

  async function add(files: File[] | null) {
    if (lock.current) return;
    if (files && files.length > 10) { setMessage("Add up to 10 images at a time."); setFailed(true); return; }
    lock.current = true; setBusy(true); setFailed(false);
    const total = files?.length ?? 1;
    let added = 0;
    let cleanupFailed = false;
    try {
      const { data: { user }, error } = await db.auth.getUser();
      if (error || !user) throw new Error("Please sign in again before adding photos.");
      for (let index = 0; index < total; index++) {
        setMessage(`Adding image ${index + 1} of ${total}…`);
        const source = files ? files[index] : new File([await placeholderPhoto(domainLabel, photos.length + index + 1)], "placeholder.png", { type: "image/png" });
        const blob = await preparePhoto(source);
        const key = `${entryId}/${files ? "image" : "demo"}-${crypto.randomUUID()}.jpg`;
        const uploaded = await db.storage.from(bucket).upload(key, blob, { contentType: "image/jpeg", upsert: false });
        if (uploaded.error) throw new Error("Could not upload this image. Check your connection and class access, then retry.");
        const inserted = await db.from("photos").insert({ entry_id: entryId, storage_key: key, uploaded_by: user.id, position: Math.max(-1, ...photos.map(p => p.position)) + index + 1 });
        if (inserted.error) {
          const cleanup = await db.storage.from(bucket).remove([key]);
          cleanupFailed = Boolean(cleanup.error);
          throw new Error("The image could not be attached to this domain. Please retry.");
        }
        added++;
      }
      setPhotos(await readPhotos());
      setMessage(`${added === 1 ? "Image" : `${added} images`} added and saved.`);
    } catch (error) {
      setFailed(true);
      setMessage(`${added ? `${added} image${added === 1 ? "" : "s"} saved. ` : ""}${error instanceof Error ? error.message : "Could not add images."}${cleanupFailed ? " An unattached private file may need administrator cleanup." : ""}`);
      try { setPhotos(await readPhotos()); } catch { /* Keep existing previews and error. */ }
    } finally { lock.current = false; setBusy(false); if (fileInput.current) fileInput.current.value = ""; }
  }

  async function removePhoto() {
    if (!remove || lock.current) return;
    lock.current = true; setBusy(true); setFailed(false);
    try {
      const result = await db.from("photos").delete().eq("id", remove.id).eq("entry_id", entryId).select("id");
      if (result.error || !result.data?.length) throw new Error("Could not remove the image. Check your access and try again.");
      const cleaned = await db.storage.from(bucket).remove([remove.storage_key]);
      setPhotos(items => items.filter(p => p.id !== remove.id)); setRemove(null);
      setFailed(Boolean(cleaned.error));
      setMessage(cleaned.error ? "Image removed from this domain. Its private file still needs administrator cleanup." : "Image removed.");
    } catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : "Could not remove this image."); }
    finally { lock.current = false; setBusy(false); }
  }

  return <section className="panel domain-photos" aria-label={`${domainLabel} photos`} onChange={event => event.stopPropagation()}>
    <div className="section-heading"><h2>Photos</h2><span className="hint">{loading ? "Loading…" : `${photos.length} added`}</span></div>
    <p className="hint">Add fictional images for this domain, or use a placeholder. Photos save separately from your notes.</p>
    <div className="photo-toolbar">
      <button type="button" className="primary" disabled={busy || loading} onClick={() => fileInput.current?.click()}><Icon name="image" />Upload images</button>
      <button type="button" className="secondary" disabled={busy || loading} onClick={() => void add(null)}><Icon name="plus" />Add placeholder</button>
      <input ref={fileInput} className="photo-file-input" type="file" aria-label={`Upload ${domainLabel} images`} accept="image/jpeg,image/png,image/webp" multiple disabled={busy || loading} onChange={event => { event.stopPropagation(); const files = [...(event.target.files ?? [])]; if (files.length) void add(files); }} />
    </div>
    <p className="photo-help hint">JPG, PNG or WebP · up to 10 MB each · images resized for the demo</p>
    {message && <p className={failed ? "error photo-feedback" : "hint photo-feedback"} role={failed ? "alert" : "status"}>{message}</p>}
    {!loading && failed && !photos.length && !busy && <button type="button" className="text-action" onClick={() => { setLoading(true); readPhotos().then(setPhotos).then(() => { setFailed(false); setMessage(""); }).catch(() => setMessage("Could not load photos. Try again.")).finally(() => setLoading(false)); }}>Reload photos</button>}
    {!loading && !photos.length && !failed && <div className="photo-empty"><Icon name="image" size={28} /><p>No photos yet</p><span className="hint">Keep a few moments alongside the learning story.</span></div>}
    {!!photos.length && <ul className="photo-grid">{photos.map((photo, index) => <li key={photo.id} className={`photo-card${index === Math.floor(eggDraw * photos.length) ? " has-peek" : ""}`}>
      {index === Math.floor(eggDraw * photos.length) && <span className="photo-peek" aria-hidden="true"><img src="/assets/riverbay/motion/squirrel-peek.webp" width={64} height={42} alt="" /></span>}
      <button type="button" className="photo-preview" aria-label={`Preview ${domainLabel} image ${index + 1}`} onClick={() => setPreview(photo)} disabled={busy}>{photo.url ? <img src={photo.url} alt={photo.caption || `${domainLabel} image ${index + 1}`} loading="lazy" /> : <span>Preview unavailable</span>}</button>
      <div className="photo-card-footer"><span>{photo.storage_key.includes("/demo-") ? "Placeholder" : `Image ${index + 1}`}</span><button type="button" className="icon-button" aria-label={`Remove ${domainLabel} image ${index + 1}`} disabled={busy} onClick={() => { setRemove(photo); setFailed(false); setMessage(""); }}><Icon name="x" size={18} /></button></div>
    </li>)}</ul>}
    {preview && <Dialog tour="photo-preview" title="Image preview" pending={false} close={() => setPreview(null)}>{preview.url && <img className="photo-full-preview" src={preview.url} alt={preview.caption || `${domainLabel} portfolio image`} />}<p className="hint">{preview.storage_key.includes("/demo-") ? "Demo placeholder · no real children" : "Uploaded image"}</p></Dialog>}
    {remove && <Dialog tour="photo-remove" title="Remove this image?" pending={busy} close={() => setRemove(null)}><p>This removes the image from this domain. Your observations and narrative stay saved.</p>{failed && <p role="alert" className="error">{message}</p>}<div className="dialog-actions photo-remove-actions"><button type="button" className="secondary" disabled={busy} onClick={() => setRemove(null)}>Keep image</button><button type="button" className="secondary danger" disabled={busy} onClick={() => void removePhoto()}>{busy ? "Removing…" : "Remove image"}</button></div></Dialog>}
  </section>;
}
