import mongoose from "mongoose";
import BodyProfile from "../models/profile.model.js"
import asyncHandler from "../utils/asyncHandler.js"
import {api_error} from "../utils/errorHandler.js"

export const createProfile = asyncHandler(async (req, res, next) => {
  // Ensure auth middleware populated req.user
  if (!req.user) {
    throw new api_error(401, 'Unauthorized: missing user');
  }

  const userId = req.user.id;
  if (!userId) {
    throw new api_error(404, 'user not found');
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new api_error(400, 'Invalid user id');
  }

  const body = req.validatedBody || req.body || {};

  // whitelist allowed fields
  const allowedFields = ['age','heightCm','weightKg','gender','skinTone','bio','avatar','location','preferences'];
  const payload = {};
  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      payload[key] = body[key];
    }
  }

  // attach user
  payload.user = new mongoose.Types.ObjectId(userId);

  try {
    // ensure a profile doesn't already exist
    const existing = await BodyProfile.findOne({ user: payload.user });
    if (existing) {
      return res.status(409).json({ error: 'Profile already exists' });
    }

    const profile = new BodyProfile(payload);
    await profile.save();

    res.status(201).json({
      message: 'Profile created successfully',
      profile
    });
  } catch (err) {
    console.error('[Profile] Error creating profile:', err);
    if (err && err.name === 'ValidationError') {
      const messages = Object.values(err.errors || {}).map(e => e.message).join('; ') || err.message || 'Validation failed';
      throw new api_error(400, 'Invalid request data: ' + messages);
    }
    throw err;
  }
});

export const updateProfile = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new api_error(401, 'Unauthorized: missing user');
  }

  const userId = req.user.id;
  if (!userId) {
    throw new api_error(404, 'user not found');
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new api_error(400, 'Invalid user id');
  }

  const body = req.validatedBody || req.body || {};

  const allowedFields = ['age','heightCm','weightKg','gender','skinTone','bio','avatar','location','preferences'];
  const updates = {};
  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided to update' });
  }

  updates.updatedAt = Date.now();

  let profile;
  try {
    profile = await BodyProfile.findOneAndUpdate(
      { user: new mongoose.Types.ObjectId(userId) },
      { $set: updates },
      {
        returnDocument: 'after',
        upsert: false,
        runValidators: true
      }
    );
  } catch (err) {
    console.error('[Profile] Error updating profile:', err);
    if (err && err.name === 'ValidationError') {
      const messages = Object.values(err.errors || {}).map(e => e.message).join('; ') || err.message || 'Validation failed';
      throw new api_error(400, 'Invalid request data: ' + messages);
    }
    throw err;
  }

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  res.status(200).json({
    message: 'Profile updated successfully',
    profile
  });
});

export const getProfile = asyncHandler(async(req,res,next) => {
    const userId  = req.user.id;
    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new api_error(400,"object id is invalid")
    }

    const profile = await BodyProfile.findOne({ user: userId });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.status(200).json(profile);
  
})