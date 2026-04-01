import UserProgress from "../models/userProgress.model.js";
import ClothingItem from "../models/clothingItem.model.js";
import { api_error } from "../utils/errorHandler.js";
import asyncHandeler from "../utils/asyncHandler.js";

export const getProgress = asyncHandeler(async(req,res,next)=>{
    const { userId } = req.query;

    if (!userId) {
        throw new api_error(400,"userId required")
    }

    let progress = await UserProgress.findOne({ userId });

    if (!progress) {
        progress = await UserProgress.create({ userId });
    }

    const wardrobeCount = await ClothingItem.countDocuments({ userId });
    progress.totalWardrobeItems = wardrobeCount;

    const level = Math.floor(progress.totalPoints / 100) + 1;
    const pointsToNextLevel = 100 - (progress.totalPoints % 100);

    let motivationalMessage = "Keep building your wardrobe!";
    if (level >= 5) motivationalMessage = "Style Sensei unlocked! 🔥";
    else if (level >= 3) motivationalMessage = "You're becoming a style pro!";
    else if (progress.currentStreak >= 3) motivationalMessage = "Streak on fire! Don't break it!";

    await progress.save();

    res.status(200).json({
        userId,
        level,
        totalPoints: progress.totalPoints,
        pointsToNextLevel,
        totalOutfitsSuggested: progress.totalOutfitsSuggested,
        totalWardrobeItems: wardrobeCount,
        currentStreak: progress.currentStreak,
        lastSuggestionDate: progress.lastSuggestionDate,
        motivationalMessage,
        badge: level >= 5 ? "Style Sensei" : level >= 3 ? "Style Enthusiast" : "Beginner Stylist"
    });
})

export const awardPoints = async (userId, points, reason = '') => {
  try {
    let progress = await UserProgress.findOne({ userId });
    if (!progress) {
        progress = new UserProgress({ userId });
    }

    progress.totalPoints += points;

    if (reason.includes('suggestion')) {
        progress.totalOutfitsSuggested += 1;

        const todayStr = new Date().toISOString().split('T')[0];
        const lastStr = progress.lastSuggestionDate ? 
                        progress.lastSuggestionDate.toISOString().split('T')[0] : null;

        if (lastStr === todayStr) {
          // same day, do nothing
        } else if (lastStr === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
            progress.currentStreak += 1;
        } else {
            progress.currentStreak = 1;
        }
        progress.lastSuggestionDate = new Date();
    }

    await progress.save();
  } catch (err) {
    console.error('awardPoints failed:', err.message);
  }
};