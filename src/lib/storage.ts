/**
 * Receipt storage abstraction.
 *
 * In development  → saves to local  /uploads  folder (just like before).
 * In production   → uploads to Cloudinary (free 25 GB, no card needed).
 *
 * Set these env vars in Vercel dashboard:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * Leave them empty to keep using local disk (works in dev / any VPS).
 */

import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export interface StoredFile {
  /** Unique key / filename to store in DB */
  key: string;
  /** Public or signed URL to retrieve the file */
  url: string;
}

function isCloudinary(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/* ────────────── Upload ────────────── */

export async function uploadReceipt(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<StoredFile> {
  if (isCloudinary()) {
    return uploadToCloudinary(buffer, mimeType, originalName);
  }
  return uploadToLocal(buffer, mimeType);
}

async function uploadToLocal(
  buffer: Buffer,
  mimeType: string,
): Promise<StoredFile> {
  const ext =
    { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" }[
      mimeType
    ] ?? "bin";
  const { randomUUID } = await import("crypto");
  const key = `${randomUUID()}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, key), buffer);
  return { key, url: `/api/expenses/receipt-local/${key}` };
}

async function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string,
  _originalName: string,
): Promise<StoredFile> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const resourceType = mimeType === "application/pdf" ? "raw" : "image";
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const form = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  form.append("file", blob);
  form.append("folder", "wattpro-receipts");
  form.append("resource_type", resourceType);

  // Signature
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const str = `folder=wattpro-receipts&resource_type=${resourceType}&timestamp=${timestamp}${apiSecret}`;
  const { createHash } = await import("crypto");
  const signature = createHash("sha1").update(str).digest("hex");
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);

  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${text}`);
  }
  const data = (await res.json()) as { public_id: string; secure_url: string };
  return { key: data.public_id, url: data.secure_url };
}

/* ────────────── Delete ────────────── */

export async function deleteReceipt(key: string): Promise<void> {
  if (isCloudinary()) {
    await deleteFromCloudinary(key);
  } else {
    await deleteFromLocal(key);
  }
}

async function deleteFromLocal(key: string): Promise<void> {
  const safeName = path.basename(key);
  await unlink(path.join(UPLOAD_DIR, safeName)).catch(() => {});
}

async function deleteFromCloudinary(publicId: string): Promise<void> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const str = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const { createHash } = await import("crypto");
  const signature = createHash("sha1").update(str).digest("hex");

  const form = new FormData();
  form.append("public_id", publicId);
  form.append("timestamp", timestamp);
  form.append("api_key", apiKey);
  form.append("signature", signature);

  await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body: form,
  }).catch(() => {});
}

/* ────────────── Read (local only) ────────────── */

export async function readLocalReceipt(key: string): Promise<Buffer | null> {
  try {
    const safeName = path.basename(key);
    return await readFile(path.join(UPLOAD_DIR, safeName));
  } catch {
    return null;
  }
}
