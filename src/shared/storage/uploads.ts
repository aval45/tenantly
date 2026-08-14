import * as ImageManipulator from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";

import { getSupabaseClient } from "@/shared/api/supabase";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;

export type PreparedUpload = {
  bytes: ArrayBuffer;
  contentType: string;
  extension: string;
};

async function fetchBytes(uri: string) {
  const response = await fetch(uri);
  if (!response.ok) throw new Error("selected_file_unreadable");
  return response.arrayBuffer();
}

export async function prepareProofImage(
  asset: ImagePickerAsset,
): Promise<PreparedUpload> {
  const converted = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: 2048 } }],
    { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
  );
  const bytes = await fetchBytes(converted.uri);
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error("image_too_large");
  return { bytes, contentType: "image/jpeg", extension: "jpg" };
}

export async function prepareDocument(
  uri: string,
  mimeType: string | null | undefined,
) {
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  const contentType = mimeType ?? "application/octet-stream";
  if (!allowed.includes(contentType))
    throw new Error("unsupported_document_type");
  const bytes = await fetchBytes(uri);
  if (bytes.byteLength > MAX_DOCUMENT_BYTES)
    throw new Error("document_too_large");
  const extension =
    contentType === "application/pdf"
      ? "pdf"
      : contentType === "image/png"
        ? "png"
        : "jpg";
  return { bytes, contentType, extension } satisfies PreparedUpload;
}

export async function removeUpload(bucket: string, path: string) {
  const { error } = await getSupabaseClient()
    .storage.from(bucket)
    .remove([path]);
  if (error && __DEV__)
    console.warn("Could not remove failed upload", error.message);
}
