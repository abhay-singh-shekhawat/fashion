import BodyProfile from "../models/profile.model.js"
import ClothingItem from "../models/clothingItem.model.js"
import getWeather from "../utils/getWeather.js"
import asyncHandeler from "../utils/asyncHandler.js"
import {api_error} from "../utils/errorHandler.js"
import { getOfflineOutfitSuggestion } from "../utils/offlineSuggestion.js"
import { awardPoints } from "./progress.controller.js"

export const chatWithStylist = asyncHandeler(async(req,res,next)=>{
    const userId = req.user.id;
    const { message } = req.body;

    if (!userId || !message) {
        throw new api_error(400,"userId and message are required")
    }

    const profile = await BodyProfile.findOne({ userId });
    if (!profile) {
        throw new api_error(404,"Create your body profile first")
    }

    const wardrobe = await ClothingItem.find({ userId });
    const weather = await getWeather();

    // keyword-based routing (this will be replaced by real LLM later)
    const lowerMsg = message.toLowerCase();

    let response = '';

    if (lowerMsg.includes('today') || lowerMsg.includes('now') || lowerMsg.includes('daily')) {
        // daily recommendation logic
        const temp = weather.temperature;
        const feel = temp < 18 ? 'cold' : temp > 32 ? 'hot' : 'mild';

        let outfit = 'Comfortable casual wear';
        if (wardrobe.length >= 2) {
            const tops = wardrobe.filter(i => i.category === 'top');
            const bottoms = wardrobe.filter(i => i.category === 'bottom');
            if (tops.length && bottoms.length) {
                const top = tops[Math.floor(Math.random() * tops.length)];
                const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
                outfit = `${top.name} + ${bottom.name}`;
            }
        }

        response = `Hey! For today in Jaipur (~${temp}°C, ${feel} weather), I recommend: **${outfit}**. `;
        if (profile.skinTone !== 'unknown') {
            response += `This should look great with your ${profile.skinTone} undertones. `;
        }
        response += `How does that sound?`;

    } else if (lowerMsg.includes('office') || lowerMsg.includes('interview') || lowerMsg.includes('work')) {
        response = "For office/interview, go with smart casual. Try a light shirt/kurti with formal trousers or chinos. Avoid very bright colors. Want me to check your wardrobe for options?";

    } else if (lowerMsg.includes('party') || lowerMsg.includes('date')) {
        response = "Party or date night? Go for something a bit more stylish — maybe a nice kurti with palazzo or a shirt with dark jeans. Add some accessories!";

    } else if (lowerMsg.includes('gym') || lowerMsg.includes('workout')) {
        response = "For gym, comfort is key. Track pants + t-shirt or sports set. Make sure it's breathable.";

    } else {
        response = `Hi! I'm your AI Stylist. I can help with daily outfits, office wear, party looks, or shopping suggestions.\n\nCurrent wardrobe has ${wardrobe.length} items.\nWeather in Jaipur is ~${weather.temperature}°C.\n\nWhat occasion are you dressing for?`;
    }

    // Award points for chatting with stylist
    await awardPoints(userId, 3, 'chat_with_stylist');

    res.status(200).json({
        userId,
        reply: response,
        wardrobeSize: wardrobe.length,
        temperature: weather.temperature,
        note: "This is a rule-based chat stub. Full agentic AI with Ollama + LangGraph coming in Phase 5."
    });
})