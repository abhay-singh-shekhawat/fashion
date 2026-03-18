import BodyProfile from "../models/profile.model.js"
import getWeather from "../utils/getWeather.js"
import asyncHandeler from "../utils/asyncHandler.js"
import {api_error} from "../utils/errorHandler.js"

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
    const temp = weoutfitather.temperature

    let tempFeel = "mild"
    if(temp < 18) tempFeel = "cold"
    if(temp > 32) tempFeel = "hot"

    // Hard coded scannig output
    let suggestion = 'Based on scanned outfit and weather, ';
    if (detection.formalityLevel === 'casual') {
        suggestion += 'this casual look works well for ';
    } else {
        suggestion += 'this semi-formal outfit is suitable for ';
    }

    if (tempFeel === 'hot') {
        suggestion += 'hot weather — consider lighter layers if possible.';
    } else if (tempFeel === 'cold') {
        suggestion += 'cold weather — add a jacket or sweater.';
    } else {
        suggestion += 'mild weather — perfect as is!';
    }

    res.status(200).json({
        userId,
        uploadedImage: req.file.filename, // just name for now
        detection,                        // fake result
        weather: { temperature: temp, feel: tempFeel },
        basicSuggestion: suggestion,
        note: 'Scanner is stubbed — real detection coming in Phase 2'
    });
})


