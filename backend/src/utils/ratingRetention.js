import OutfitRating from "../models/outfitRating.model.js";
import cloudinary from "../configs/cloudinary.js";

/* Unstarred fits are kept for two weeks; starred ones are kept for good. */
export const RETENTION_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export const retentionCutoff = (now = new Date()) =>
  new Date(now.getTime() - RETENTION_DAYS * DAY_MS);

/**
 * Drop every unstarred rating older than the retention window, along with the
 * photo uploaded for it. Favourites are never touched, so the sweep can run
 * unattended. Exported so it can be invoked directly instead of waiting for the
 * nightly schedule.
 */
export const sweepExpiredRatings = async () => {
  const cutoff = retentionCutoff();

  const expired = await OutfitRating.find({
    isFavourite: false,
    createdAt: { $lt: cutoff }
  }).select("_id publicId");

  let imagesRemoved = 0;
  for (const rating of expired) {
    /* Pasted links have no asset of ours to remove. */
    if (!rating.publicId) continue;
    try {
      await cloudinary.uploader.destroy(rating.publicId);
      imagesRemoved += 1;
    } catch (error) {
      console.warn(`[Rating Retention] Could not remove ${rating.publicId}: ${error.message}`);
    }
  }

  /* Re-check the flag: a rating starred while the sweep was running has just
     earned its place, and must not be swept out from under the user. */
  const result = await OutfitRating.deleteMany({
    _id: { $in: expired.map((rating) => rating._id) },
    isFavourite: false
  });

  return { deleted: result.deletedCount ?? 0, imagesRemoved, cutoff };
};
