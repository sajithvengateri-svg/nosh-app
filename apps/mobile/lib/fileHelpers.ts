import { supabase } from "./supabase";

/**
 * Convert a local file URI to base64 string
 */
export async function fileToBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix if present (e.g., "data:image/jpeg;base64,")
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Decode base64 string to ArrayBuffer
 */
export function decodeBase64(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Upload file data to Supabase storage bucket
 * @returns Public URL of uploaded file
 */
export async function uploadToStorage(
  bucket: string,
  path: string,
  data: ArrayBuffer | Blob,
  contentType: string
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, data, { contentType });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}

/**
 * Get public URL for a file in a Supabase storage bucket
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a base64-encoded image to storage
 * @returns Public URL
 */
export async function uploadBase64Image(
  bucket: string,
  orgId: string,
  base64: string,
  folder: string = "uploads"
): Promise<string> {
  const fileName = `${folder}/${orgId}/${Date.now()}.jpg`;
  const arrayBuffer = decodeBase64(base64);
  return uploadToStorage(bucket, fileName, arrayBuffer, "image/jpeg");
}

/**
 * Upload a document (PDF, etc.) from a local URI to storage
 * @returns Public URL
 */
export async function uploadDocument(
  bucket: string,
  orgId: string,
  uri: string,
  mimeType: string,
  folder: string = "documents"
): Promise<string> {
  const ext = mimeType === "application/pdf" ? "pdf" : mimeType.split("/")[1] || "bin";
  const fileName = `${folder}/${orgId}/${Date.now()}.${ext}`;
  const response = await fetch(uri);
  const blob = await response.blob();
  const arrayBuffer = await new Response(blob).arrayBuffer();
  return uploadToStorage(bucket, fileName, arrayBuffer, mimeType);
}
