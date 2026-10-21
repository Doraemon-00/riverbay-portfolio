"use client";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
export const maxPhotoBytes = 10 * 1024 * 1024;

/** Decode/re-encode in the browser: bounded resolution and no original EXIF payload. */
export async function preparePhoto(file: File): Promise<Blob> {
  if (!acceptedTypes.has(file.type)) throw new Error("Choose a JPG, PNG or WebP image.");
  if (file.size > maxPhotoBytes) throw new Error("Choose images smaller than 10 MB each.");
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error("This image could not be opened. Try another JPG, PNG or WebP."); }
  try {
    const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not prepare this image.")), "image/jpeg", 0.85));
  } finally { bitmap.close(); }
}

/** Deliberately labelled neutral stand-in, not generated artwork or a real child. */
export async function placeholderPhoto(domain: string, number: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1200; canvas.height = 800;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not create a placeholder.");
  const colours = ["#dcece2", "#e5e1ef", "#f0e6d1", "#dfeaf0"];
  context.fillStyle = colours[(number - 1) % colours.length];
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#39584a";
  context.textAlign = "center";
  context.font = "600 48px sans-serif";
  context.fillText("Sample activity photo", 600, 330);
  context.font = "32px sans-serif";
  context.fillText(`${domain} · ${number}`, 600, 405);
  context.font = "24px sans-serif";
  context.fillText("Placeholder only · no real children", 600, 485);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not create a placeholder.")), "image/png"));
}
