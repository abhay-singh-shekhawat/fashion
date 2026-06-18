import mongoose from "mongoose";
import BodyProfile from "../models/profile.model.js"
import asyncHandler from "../utils/asyncHandler.js"
import {api_error} from "../utils/errorHandler.js"

export const createOrUpdateProfile = asyncHandler(async(req,res,next)=>{
    // Ensure auth middleware populated req.user
    if (!req.user) {
      throw new api_error(401, 'Unauthorized: missing user');
    }

    console.log('[Profile] createOrUpdateProfile called for user:', req.user?.id);
    console.log('[Profile] request body:', JSON.stringify(req.body));

    const userId  = req.user.id;
    if (!userId) {
      throw new api_error(404,"user not found")
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new api_error(400, 'Invalid user id');
    }

    // Prefer validatedBody from the validate middleware when available
    const body = req.validatedBody || req.body || {};

    // Whitelist allowed profile fields to avoid validation errors from unexpected keys
    const allowedFields = ['age','heightCm','weightKg','gender','skinTone','bio','avatar','location','preferences'];
    const updates = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        updates[key] = body[key];
      }
    }

    // Ensure we always set updatedAt and the user field required by the model
    updates.updatedAt = Date.now();
    updates.user = new mongoose.Types.ObjectId(userId);

    let profile;
    try {
      profile = await BodyProfile.findOneAndUpdate(
        { user: new mongoose.Types.ObjectId(userId) },
        { $set: updates },
        { 
          new: true,          // return updated doc
          upsert: true,       // create if not exists
          runValidators: true // enforce schema rules
        }
      );
    } catch (err) {
      // Surface validation errors clearly
      console.error('[Profile] Error updating profile:', err);
      if (err && err.name === 'ValidationError') {
        const messages = Object.values(err.errors || {}).map(e => e.message).join('; ') || err.message || 'Validation failed';
        throw new api_error(400, 'Invalid request data: ' + messages);
      }
      throw err;
    }

    if(!profile){
        throw new api_error(404,"profile with this user not found")
    }

    res.status(200).json({
      message: 'Profile saved successfully',
      profile
    })
})

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