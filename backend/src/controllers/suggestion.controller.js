import BodyProfile from "../models/profile.model.js"
import getWeather from "../utils/getWeather.js"
import asyncHandeler from "../utils/asyncHandler.js"
import {api_error} from "../utils/errorHandler.js"
import ClothingItem from "../models/clothingItem.model.js"
import { getRecommendedColors } from "../utils/skinTonePalatte.js"
import { awardPoints } from "./progress.controller.js"
import { getOfflineOutfitSuggestion } from "../utils/offlineSuggestion.js"
import { generateShoppingSuggestions } from '../utils/shoppingSuggestion.js';


export const getOutfitSuggestion = asyncHandeler(async(req,resizeBy,next)=>{
    const userId  = req.user.id;

    if (!userId) {
        throw new api_error(400,"userId is essential for suggestions")
    }

    const profile = await BodyProfile.findOne({ userId });

    if (!profile) {
        throw new api_error(404,"create a profile")
    }

    const weather = await getWeather();
    const temp = weather.temperature;

    // Hard coded temperature
    let tempFeel = 'mild';
    if (temp < 18) tempFeel = 'cold';
    else if (temp > 32) tempFeel = 'hot';

    // Fake occasion — later real input
    const occasion = 'casual daily';

    // Hard coded suggestion
    let suggestions = [];

    if (profile.gender === 'female') {
      if (tempFeel === 'hot') {
        suggestions = [
          'Light cotton kurti + palazzo pants + dupatta (optional)',
          'Short kurti + leggings + minimal jewellery'
        ];
      } else if (tempFeel === 'cold') {
        suggestions = [
          'Full-sleeve kurti + jeans + light jacket or shawl',
          'Sweater + salwar kameez'
        ];
      } else {
        suggestions = [
          'Cotton kurti + churidar or jeans',
          'Casual top + palazzo or skirt'
        ];
      }
    } else {
      // For males
      if (tempFeel === 'hot') {
        suggestions = [
          'Cotton t-shirt + jeans / chinos',
          'Polo shirt + shorts (if very hot)'
        ];
      } else if (tempFeel === 'cold') {
        suggestions = [
          'Full-sleeve shirt + jeans + light jacket',
          'Sweater + trousers'
        ];
      } else {
        suggestions = [
          'Casual shirt + jeans',
          'T-shirt + chinos or jeans'
        ];
      }
    }

    // Weather-aware note
    let weatherNote = `It's currently ~${temp}°C in Jaipur — ${tempFeel} feel.`;
    if (!weather.isDay) weatherNote += ' (night time — consider slightly warmer layers)';

    res.status(200).json({
      userId,
      temperature: temp,
      weatherNote,
      occasion,
      suggestions: suggestions.slice(0, 2),
      basedOn: 'basic rules + current weather'
    });
})

export const getDailyRecommendations = asyncHandeler(async(req,res,next)=>{
    const userId  = req.user.id;

    if (!userId) {
      throw new api_error(400,"userId required (query param)")
    }

    const profile = await BodyProfile.findOne({ userId });
    if (!profile) {
      throw new api_error(404,"Create your body profile first")
    }

    const weather = await getWeather();
    const temp = weather.temperature;
    const feel = temp < 18 ? 'cold' : temp > 32 ? 'hot' : 'mild';

    // Get wardrobe-based outfit
    const items = await ClothingItem.find({ userId });
    let outfit = null;
    let source = 'wardrobe';

    if (items.length >= 2) {
      const tops = items.filter(i => i.category === 'top');
      const bottoms = items.filter(i => i.category === 'bottom');

      if (tops.length > 0 && bottoms.length > 0) {
        const top = tops[Math.floor(Math.random() * tops.length)];
        const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
        outfit = `${top.name} (${top.color}) + ${bottom.name} (${bottom.color})`;
      }
    }

    // Fallback if wardrobe too empty
    if (!outfit) {
      source = 'offline_rules';
      const offline = getOfflineOutfitSuggestion(profile, items);
      outfit = offline.suggestion;
      weatherData = offline;
    }

    const scanNote = items.length > 0 
      ? `Today's outfit based on your wardrobe (last fake scan: ${new Date().toLocaleDateString()})`
      : 'No recent scan — using basic rules';

    let skinToneNote = '';
    if (profile.skinTone !== 'unknown') {
      const palette = getRecommendedColors(profile.skinTone);
      skinToneNote = `Skin tone tip (${profile.skinTone}): Try more ${palette.best.slice(0, 3).join(', ')} for a flattering glow.`;
    }

    await awardPoints(userId, 5, 'daily_suggestion');

    res.status(200).json({
      userId,
      date: new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
      temperature: temp,
      weatherFeel: feel,
      recommendation: {
        outfit,
        source,
        message: `Hey Abhay, for ${weatherData.weatherFeel || feel} ${weatherData.isDay ? 'day' : 'evening'} (~${weatherData.temperature}°C), try: ${outfit}`,
        weatherSource: weatherData.source || 'online'
      },
      note: 'This is the Phase 2 unified daily recommendation — real intelligence starts in Phase 2'
    });
})

export const getShoppingSuggestions = asyncHandeler(async (req, res) => {
    const userId  = req.user.id;

    if (!userId) {
        throw new api_error(400,"userId is required")
    }

    const profile = await BodyProfile.findOne({ userId });
    if (!profile) {
        throw new api_error(404,"Create your body profile first")
    }

    const wardrobeItems = await ClothingItem.find({ userId }).sort({ addedAt: -1 });

    const shopping = generateShoppingSuggestions(profile, wardrobeItems);

    res.status(200).json({
        userId,
        wardrobeSize: wardrobeItems.length,
        ...shopping
    });
  })