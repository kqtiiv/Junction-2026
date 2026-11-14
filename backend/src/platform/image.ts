// Minimal image inspection for capture uploads: type, dimensions, and whether EXIF
// metadata is still present. The phone must strip EXIF/GPS before upload (DEC-006);
// the server checks rather than trusts the client's `minimisation` claim.
import { PlatformError } from "../errors.ts";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export interface ImageInfo { mime: "image/jpeg" | "image/png"; width: number; height: number; hasExif: boolean }

const bad = (detail: string) => new PlatformError("CAPTURE_UNUSABLE", { detail });

export function inspectImage(buf: Buffer): ImageInfo {
  if (buf.length > MAX_IMAGE_BYTES) throw bad("image too large");
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8) return inspectJpeg(buf);
  if (buf.length > 24 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return {
      mime: "image/png",
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20),
      hasExif: buf.includes(Buffer.from("eXIf")),
    };
  }
  throw bad("not a JPEG or PNG image");
}

function inspectJpeg(buf: Buffer): ImageInfo {
  let i = 2;
  let width = 0, height = 0, hasExif = false;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) throw bad("corrupt JPEG marker");
    const marker = buf[i + 1]!;
    if (marker === 0xd9 || marker === 0xda) break; // EOI or start of scan: no more headers
    const len = buf.readUInt16BE(i + 2);
    if (marker === 0xe1 && buf.subarray(i + 4, i + 10).toString("latin1") === "Exif\0\0") hasExif = true;
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof && i + 9 <= buf.length) {
      height = buf.readUInt16BE(i + 5);
      width = buf.readUInt16BE(i + 7);
    }
    i += 2 + len;
  }
  if (!width || !height) throw bad("JPEG without dimensions");
  return { mime: "image/jpeg", width, height, hasExif };
}
