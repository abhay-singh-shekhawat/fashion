import cloudinary from "../../configs/cloudinary.js";
import { api_error } from "../errorHandler.js";
import { MAX_UPLOAD_MB } from "./multer.js";

/* Cloudinary's own default is 60s — the same as the reverse proxy's read
   timeout, so the proxy wins the race and answers with an HTML 504 that has no
   CORS headers. The app then reports "can't reach the server" instead of the
   real problem. Giving up at 30s makes our JSON error the one that arrives. */
const UPLOAD_TIMEOUT_MS = 30000;

/* Nothing downstream needs more than 1600px — that is already what the browser
   sends — but the cap also covers pasted image links and any client that skips
   the in-browser resize, so oversized originals never reach storage. */
const UPLOAD_TRANSFORMATION = [
  { width: 1600, height: 1600, crop: "limit" },
  { quality: "auto:good" }
];

/* Cloudinary takes a data URI, a public URL or a local path as the file, so a
   multer upload and a pasted link can share one path. */
const asUploadSource = (file) =>
  typeof file === "string"
    ? file
    : `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

/**
 * Store an image in Cloudinary and return the asset.
 *
 * Failures come back as an api_error carrying a message the user can act on
 * (the SDK's own text is a Cloudinary API dump), while the caller keeps its own
 * fallback — a failed upload must never take the screen down with it.
 */
export const uploadImage = async (file, { folder, publicId }) => {
  try {
    return await cloudinary.uploader.upload(asUploadSource(file), {
      folder,
      public_id: publicId,
      overwrite: false,
      resource_type: "image",
      transformation: UPLOAD_TRANSFORMATION,
      timeout: UPLOAD_TIMEOUT_MS
    });
  } catch (error) {
    console.error("[Upload] Cloudinary rejected the upload:", error?.message || error);

    const message = error?.message ?? "";

    /* Cloudinary's plan cap can sit below multer's, and its own wording
       ("File size too large. Got 12345678. Maximum is 10485760.") reads like a
       server fault. Report the limit that actually applied, in MB. */
    if (/too large/i.test(message)) {
      const maxBytes = Number(/maximum is (\d+)/i.exec(message)?.[1]);
      const limit =
        Number.isFinite(maxBytes) && maxBytes > 0
          ? `${Math.round(maxBytes / (1024 * 1024))}MB`
          : `${MAX_UPLOAD_MB}MB`;
      throw new api_error(413, `That photo is too large to store — the limit is ${limit}`);
    }

    const timedOut = /timeout/i.test(message);
    throw new api_error(
      timedOut ? 504 : 502,
      timedOut
        ? "Uploading the photo took too long — please try again"
        : "Could not store that photo — please try again"
    );
  }
};
