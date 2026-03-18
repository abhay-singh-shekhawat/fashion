import BodyProfile from "../models/profile.model.js"
import getWeather from "../utils/getWeather.js"
import asyncHandeler from "../utils/asyncHandler.js"
import {api_error} from "../utils/errorHandler.js"

export const getOutfitSuggestion = asyncHandeler(async(req,resizeBy,next)=>{
    const { userId } = req.query;

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