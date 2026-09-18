import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import { api_error } from "../utils/errorHandler.js";
import OutfitRating from "../models/outfitRating.model.js";
import cloudinary from "../configs/cloudinary.js";

/* Newest first, capped — the list carries whole ratings so the history screen
   and the detail panel can re-render a stored fit without a second round trip. */
const HISTORY_LIMIT = 100;

/* A malformed id would otherwise reach Mongoose and surface as a 500. */
const findOwnRating = async (userId, id) => {
  if (!mongoose.isValidObjectId(id)) throw new api_error(404, "Rating not found");

  const item = await OutfitRating.findOne({ _id: id, userId });
  if (!item) throw new api_error(404, "Rating not found");
  return item;
};

export const getRatingHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const items = await OutfitRating.find({ userId }).sort({ createdAt: -1 }).limit(HISTORY_LIMIT);

  res.status(200).json({ items });
});

export const getRating = asyncHandler(async (req, res) => {
  const item = await findOwnRating(req.user.id, req.params.id);

  res.status(200).json({ item });
});

/**
 * PATCH /api/outfit/history/:id/favourite
 * Takes the desired value rather than toggling, so a double tap or a retried
 * request can't leave the star flipped the wrong way.
 */
export const setFavourite = asyncHandler(async (req, res) => {
  const { isFavourite } = req.body;
  if (typeof isFavourite !== "boolean") {
    throw new api_error(400, "isFavourite must be true or false");
  }

  const existing = await findOwnRating(req.user.id, req.params.id);
  existing.isFavourite = isFavourite;
  await existing.save();

  res.status(200).json({ success: true, item: existing });
});

export const deleteRating = asyncHandler(async (req, res) => {
  const item = await findOwnRating(req.user.id, req.params.id);
  await item.deleteOne();

  /* The stored photo goes with the record. Best-effort: a pasted link has no
     asset behind it, and a failed delete must not resurrect the rating. */
  if (item.publicId) {
    try {
      await cloudinary.uploader.destroy(item.publicId);
    } catch (error) {
      console.warn(`[Rating History] Could not remove Cloudinary asset ${item.publicId}: ${error.message}`);
    }
  }

  res.status(200).json({ success: true, deleted: item._id });
});
