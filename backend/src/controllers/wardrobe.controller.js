import BodyProfile from "../models/profile.model.js"
import ClothingItem from "../models/clothingItem.model.js"
import getWeather from "../utils/getWeather.js"
import asyncHandeler from "../utils/asyncHandler.js"
import {api_error} from "../utils/errorHandler.js"
import {getColorCompatibility} from "../utils/colorHarmony.js"
import { getRecommendedColors } from "../utils/skinTonePalatte.js"

export const addClothingItem = asyncHandeler(async(req,res,next)=>{
    const { userId, name, category, color } = req.body;

    if (!userId || !name || !category) {
        throw new api_error(400,"userId, name, and category are required")
    }

    const item = new ClothingItem({
        userId,
        name,
        category,
        color: color || 'unknown'
    });

    await item.save();

    res.status(201).json({
        message: 'Item added to wardrobe',
        item
    });
})

export const getWardrobe = asyncHandeler(async(req,res,next)=>{
    const { userId } = req.query;

    if (!userId) {
        throw new api_error(400,"userId required (query param)")
    }

    const items = await ClothingItem.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ items });
})

export const getWardrobeSuggestions = asyncHandeler(async(req,res,next)=>{
    const { userId } = req.query;

    if (!userId) {
      throw new api_error(400,"userId required")
    }

    const profile = await BodyProfile.findOne({ userId });
    if (!profile) {
      throw new api_error(404,"Create profile first")
    }

    const items = await ClothingItem.find({ userId });
    if (items.length === 0) {
      return res.status(200).json({
        message: 'Wardrobe is empty — add some items first!',
        suggestion: null
      });
    }

    const weather = await getWeather();
    const temp = weather.temperature;
    let feel = temp < 18 ? 'cold' : temp > 32 ? 'hot' : 'mild';

    // Possible suggestion
    const tops = items.filter(i => i.category === 'top');
    const bottoms = items.filter(i => i.category === 'bottom');

    let suggestion = null;
    let harmony = null;
    if (tops.length > 0 && bottoms.length > 0) {
      for (let i = 0; i < 5; i++) {
        const top = tops[Math.floor(Math.random() * tops.length)];
        const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];

        harmony = getColorCompatibility(top.color, bottom.color);

        if (harmony.score >= 60) {
          suggestion = {
            outfit: `${top.name} (${top.color}) + ${bottom.name} (${bottom.color})`,
            weatherFit: `Good for ${feel} weather (~${temp}°C)`,
            colorScore: harmony.score,
            colorMessage: harmony.message,
            note: 'Picked a reasonably matching color combo from your wardrobe'
          };
          break;
        }
      }
      if (!suggestion) {
        const top = tops[Math.floor(Math.random() * tops.length)];
        const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
        harmony = getColorCompatibility(top.color, bottom.color);

        suggestion = {
          outfit: `${top.name} (${top.color}) + ${bottom.name} (${bottom.color})`,
          weatherFit: `Good for ${feel} weather (~${temp}°C)`,
          colorScore: harmony.score,
          colorMessage: harmony.message + ' (best available — add more items for better matches)',
          note: 'Limited matching options — expand wardrobe'
        };
      }
    }
    let skinToneFit = '';
    if (profile.skinTone !== 'unknown') {
      const palette = getRecommendedColors(profile.skinTone);
      const topColor = tops.length > 0 ? tops[0].color.toLowerCase() : ''; // Rough example
      const bottomColor = bottoms.length > 0 ? bottoms[0].color.toLowerCase() : '';

      if (palette.best.some(c => topColor.includes(c) || bottomColor.includes(c))) {
        skinToneFit = `This combo aligns nicely with ${profile.skinTone} undertones — good choice!`;
      } else {
        skinToneFit = `For ${profile.skinTone} undertones, consider adding items in ${palette.best.slice(0,3).join(', ')} for even better harmony.`;
      }
    } else {
      skinToneFit = 'Add your skin tone to profile for color harmony tips';
    }

    res.status(200).json({
      userId,
      wardrobeCount: items.length,
      temperature: temp,
      suggestion,
      skinToneFit,
      profileSkinTone: profile.skinTone
    });
})