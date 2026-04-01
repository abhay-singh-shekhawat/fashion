import BodyProfile from "../models/profile.model.js"
import getWeather from "../utils/getWeather.js"
import asyncHandeler from "../utils/asyncHandler.js"
import {api_error} from "../utils/errorHandler.js"
import { awardPoints } from "./progress.controller.js"

const detectOutfit = async(imagePath)=>{
    // Possible fake types
    const possibleTypes = ['t-shirt', 'jeans', 'kurti', 'salwar', 'jacket', 'saree'];
    const possibleColors = ['blue', 'white', 'red', 'black', 'green', 'yellow'];

    return {
        detectedItems: [
        { type: possibleTypes[Math.floor(Math.random() * possibleTypes.length)], color: possibleColors[Math.floor(Math.random() * possibleColors.length)], confidence: 0.92 },
        { type: possibleTypes[Math.floor(Math.random() * possibleTypes.length)], color: possibleColors[Math.floor(Math.random() * possibleColors.length)], confidence: 0.87 }
        ],
        formalityLevel: Math.random() > 0.6 ? 'casual' : 'semi-formal',
        layers: Math.random() > 0.7 ? 2 : 1,
        note: 'This is a FAKE detection for Phase 1 testing'
    };
};

export const scanOutfit = asyncHandeler(async(req,res,next)=>{
    const { userId } = req.body;
    if (!userId) {
        throw new api_error(400,"userId is required")
    }
    const profile = await BodyProfile.findOne({ userId });
    if (!profile) {
        throw new api_error(404,"Profile not found — create one first")
    }
    if (!req.file) {
        throw new api_error(400,"No image uploaded")
    }

    const detection = detectOutfit(req.file.path)
    const weather = await getWeather();
    const temp = weather.temperature

 // Auto-save detected items to wardrobe
    const savedItems = [];
    for (const item of detection.detectedItems) {
        const newItem = new ClothingItem({
            userId,
            name: `${item.color} ${item.type}`,
            category: item.type.includes('shirt') || item.type.includes('kurti') || item.type.includes('t-shirt') ? 'top' : 'bottom',
            color: item.color,
            formality: detection.formalityLevel,
            imageUrl: `/uploads/${req.file.filename}`,
            detectedBy: 'scanner',
            confidence: item.confidence
      });
      await newItem.save();
      savedItems.push(newItem);
    }

    // Award points for scanning
    await awardPoints(userId, 15, 'outfit_scanned');

    res.status(200).json({
        userId,
        uploadedImage: req.file.filename,
        detection,
        savedItemsCount: savedItems.length,
        weather: {
          temperature: weather.temperature,
          feel: weather.source === 'offline_fallback' ? 'offline' : 'online'
        },
        message: `${savedItems.length} items automatically added to your wardrobe from scan`,
        note: 'Scanner is still using fake detection. Real YOLOv8 coming soon.'
    });
})