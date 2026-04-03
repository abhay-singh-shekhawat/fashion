import mongoose from "mongoose";
import BodyProfile from "../models/profile.model.js"
import asyncHandler from "../utils/asyncHandler.js"
import {api_error} from "../utils/errorHandler.js"

export const createOrUpdateProfile = asyncHandler(async(req,res,next)=>{
    const userId  = req.user.id;
    if (!userId) {
      throw new api_error(404,"user not found")
    }
    const profile = await BodyProfile.findOneAndUpdate(
      { userId },
      { ...req.body, updatedAt: Date.now() },
      { 
        new: true,          // return updated doc
        upsert: true,       // create if not exists
        runValidators: true // enforce schema rules
      }
    );
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

    const profile = await BodyProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.status(200).json(profile);
  
})