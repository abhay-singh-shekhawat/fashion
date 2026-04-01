import BodyProfile from "../models/profile.model.js"
import ClothingItem from "../models/clothingItem.model.js"
import getWeather from "../utils/getWeather.js"
import asyncHandeler from "../utils/asyncHandler.js"
import {api_error} from "../utils/errorHandler.js"
import {getColorCompatibility} from "../utils/colorHarmony.js"
import { getRecommendedColors } from "../utils/skinTonePalatte.js"
import { calculateOutfitScore, estimateWeatherSuitability, estimateSkinToneFit } from '../utils/outfitScorer.js';
import { awardPoints } from "./progress.controller.js"

const occasionToFormalities = {
    casual: ['casual', 'smart_casual', 'sporty'],
    daily: ['casual', 'smart_casual'],
    office: ['smart_casual', 'business', 'formal'],
    interview: ['business', 'formal'],
    party: ['party', 'formal', 'traditional'],
    gym: ['sporty'],
    traditional: ['traditional'],
    date: ['smart_casual', 'party']
};

export const addClothingItem = asyncHandeler(async(req,res,next)=>{
    const { userId, name, category, color, formality} = req.body;

    if (!userId || !name || !category) {
      throw new api_error(400,"userId, name, and category are required")
    }

    const item = new ClothingItem({
      userId,
      name,
      category,
      color: color || 'unknown',
      formality: formality || `unknown`
    });

    await item.save();

    await awardPoints(userId, 10, 'wardrobe_item_added');

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
          // Outfit score
          const colors = [top.color, bottom.color].filter(Boolean);
          const categories = [top.category, bottom.category].filter(Boolean);

          const skinFit = estimateSkinToneFit(profile.skinTone, colors);
          const weatherFit = estimateWeatherSuitability(feel, categories);
          const formality = 20; // fake: assume casual = 20/25 for now
          const isScanned = [top, bottom].some(item => item.detectedBy === 'scanner');
          const avgConfidence = 0.85; // placeholder — calculate real average later

          const colorScore = harmony.score || 60;

          const outfitScore = calculateOutfitScore({
            colorHarmonyScore: harmony.score || 60,
            skinToneFit: skinFit,
            weatherSuitability: weatherFit,
            formalityMatch: formality,
            scanConfidence: avgConfidence,
            isScanned
          });
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
        // Outfit score
        const colors = [top.color, bottom.color].filter(Boolean);
        const categories = [top.category, bottom.category].filter(Boolean);

        const skinFit = estimateSkinToneFit(profile.skinTone, colors);
        const weatherFit = estimateWeatherSuitability(feel, categories);
        const formality = 20; // fake: assume casual = 20/25 for now
        const isScanned = [top, bottom].some(item => item.detectedBy === 'scanner');
        const avgConfidence = 0.85; // placeholder — calculate real average later

        const colorScore = harmony.score || 60;

        const outfitScore = calculateOutfitScore({
          colorHarmonyScore: colorScore,
          skinToneFit: skinFit,
          weatherSuitability: weatherFit,
          formalityMatch: formality,
          scanConfidence: avgConfidence,
          isScanned
        });
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

    await awardPoints(userId, 5, 'wardrobe_suggestion');

    res.status(200).json({
      userId,
      wardrobeCount: items.length,
      temperature: temp,
      suggestion,
      outfitScore,
      skinToneFit,
      profileSkinTone: profile.skinTone
    });
})

export const getOccasionSuggestion = asyncHandeler(async(req,res,next)=>{
    const { userId, occasion = 'casual' } = req.query;

    if (!userId) {
      throw new api_error(400,"userId required")
    }

    if (!occasionToFormalities[occasion]) {
      throw new api_error(400,"Unknown occasion. Try: casual, office, party, gym, date, interview")
    }

    const profile = await BodyProfile.findOne({ userId });
    if (!profile) throw new api_error(404,"Profile with the userId not found")

    const items = await ClothingItem.find({ userId });

    const allowedFormalities = occasionToFormalities[occasion];

    const suitableItems = items.filter(item => 
      allowedFormalities.includes(item.formality) ||
      item.formality === 'unknown'  // Unknown as fallback
    );

    if (suitableItems.length < 2) {
      return res.status(200).json({
        occasion,
        message: `Not enough suitable items for ${occasion}. Add more with formality: ${allowedFormalities.join(', ')}`,
        suggestion: null,
        availableCount: suitableItems.length
      });
    }

    const tops = suitableItems.filter(i => i.category === 'top');
    const bottoms = suitableItems.filter(i => i.category === 'bottom');

    if (tops.length === 0 || bottoms.length === 0) {
      return res.status(200).json({
        occasion,
        message: 'Missing tops or bottoms suitable for this occasion',
        suggestion: null
      });
    }

    const top = tops[Math.floor(Math.random() * tops.length)];
    const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];

    const harmony = getColorCompatibility(top.color, bottom.color);
    const colors = [top.color, bottom.color];
    const categories = [top.category, bottom.category];

    const skinFit = estimateSkinToneFit(profile.skinTone, colors);
    const weatherFit = estimateWeatherSuitability(feel, categories); // feel from earlier weather
    const formalityMatch = allowedFormalities.includes(top.formality) && 
                          allowedFormalities.includes(bottom.formality) ? 25 : 15;

    const outfitScore = calculateOutfitScore({
      colorHarmonyScore: harmony.score || 60,
      skinToneFit: skinFit,
      weatherSuitability: weatherFit,
      formalityMatch
    });

    await awardPoints(userId, 5, 'occasion_suggestion');

    res.status(200).json({
      occasion,
      suggestion: `${top.name} (${top.color}, ${top.formality}) + ${bottom.name} (${bottom.color}, ${bottom.formality})`,
      formalityMatch: formalityMatch === 25 ? 'Perfect formality match' : 'Acceptable but not ideal',
      outfitScore,
      weatherNote: `~${temp}°C – ${feel}`,
      colorMessage: harmony.message
    });
})