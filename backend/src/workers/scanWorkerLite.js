import {Worker} from "bullmq"
import { scanQueuelite } from "../configs/queue.js"
import ClothingItem from "../models/clothingItem.model.js"
import BodyProfile from "../models/profile.model.js"
import { awardPoints } from "../controllers/progress.controller.js"
import getWeather from "../utils/getWeather.js"
import { generateOutfitTips, generateQuickOutfitTips } from "../utils/generateOutfitTips.js"
import {
  calculateOutfitScore,
  estimateWeatherSuitability,
  estimateSkinToneFit
} from "../utils/outfitScorer.js"
import {
  emitRatingComplete,
  emitRatingError,
  emitScanProgress,
  emitRatingWeatherDone,
  emitRatingTipsComplete,
  emitRatingScoreDone,
} from "../services/socketService.js"
import crypto from "crypto"
import {GoogleGenerativeAI} from "@google/generative-ai"

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const scanWorker = new Worker(`outfit-scan-lite`,async(job)=>{
    const { userId, imageUrl, publicId, imageHash, occasion = "casual", detailedFeedback = false } = job.data;
    try {
        // Image-level deduplication
        const duplicateImage = await ClothingItem.exists({ userId, imageHash });
        if (duplicateImage) {
            console.log(`Duplicate image detected for user ${userId} - skipping`);
            return { status: 'we have already told about the same outfit' };
        }

        const model = genAi.getGenerativeModel({model: `gemini-1.5-flash`})
        const prompt = `Analyze this outfit image in detail for a fashion app.
        Return JSON only with this structure:
        {
          "detectedItems": [
            {"type": "shirt|kurti|jeans|trousers|jacket|saree|...", "color": "blue|red|...", "confidence": 0.9},
            ...
          ],
          "formalityLevel": "casual|smart_casual|formal|party|traditional",
          "layers": 1 or 2,
          "overallStyle": "brief description",
          "colorPalette": ["color1", "color2"]
        }`;

        const result = await model.generateContent([
            prompt,
            {
                fileData: {
                    fileUri: imageUrl
                }
            }
        ]);
        const responseText = result.response.text();
        let analysis;
        try {
          analysis = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`Failed to parse Gemini response: ${parseError.message}`);
        }

        console.log(`Scan job ${job.id} completed - Item Data: ${analysis.detectedItems.length}`);

        // ========== GET WEATHER ==========
        let weatherData;
        try {
          await emitScanProgress(userId, { status: "fetching_weather", message: "Checking local weather...", progress: 60 });
          weatherData = await getWeather();
          await emitRatingWeatherDone(userId, 0, {
            temperature: weatherData.temperature,
            condition: weatherData.condition,
            isDay: weatherData.isDay
          });
        } catch (weatherError) {
          weatherData = { temperature: 25, condition: "clear", isDay: true };
        }

        // ========== CALCULATE SCORES ==========
        const categories = analysis.detectedItems.map(item => item.type?.toLowerCase()).filter(Boolean);
        const tempCategory = weatherData.temperature > 28 ? "hot" : weatherData.temperature < 15 ? "cold" : "mild";
        const weatherScore = estimateWeatherSuitability(tempCategory, categories);

        let skinToneScore = 0;
        const bodyProfile = await BodyProfile.findOne({ user: userId });
        if (bodyProfile?.skinTone && bodyProfile.skinTone !== 'unknown') {
          const colors = analysis.detectedItems.map(item => item.color);
          skinToneScore = estimateSkinToneFit(bodyProfile.skinTone, colors);
        }

        const colorHarmonyEstimate = Math.min(100, 50 + (analysis.detectedItems.length * 15));
        const formalityMap = { casual: 12, smart_casual: 18, formal: 22, party: 20, traditional: 18 };
        const formalityMatch = formalityMap[analysis.formalityLevel] || 15;

        const outfitScore = calculateOutfitScore({
          colorHarmonyScore: colorHarmonyEstimate,
          skinToneFit: skinToneScore,
          weatherSuitability: weatherScore,
          formalityMatch,
          isScanned: true,
          scanConfidence: 0.85
        });

        await emitRatingScoreDone(userId, outfitScore.score, outfitScore.message, outfitScore.breakdown);

        // ========== GET TIPS ==========
        let improvementTips = null;
        try {
          await emitScanProgress(userId, { status: "generating_tips", message: "Creating personalized suggestions...", progress: 75 });
          const tipsResponse = detailedFeedback
            ? await generateOutfitTips({ outfitScore, detectedItems: analysis.detectedItems, weather: weatherData, userProfile: bodyProfile || {}, occasion })
            : await generateQuickOutfitTips({ outfitScore, detectedItems: analysis.detectedItems, weather: weatherData, userProfile: bodyProfile || {}, occasion });

          improvementTips = { tips: tipsResponse.tips, mode: detailedFeedback ? "detailed" : "quick", model: tipsResponse.model };
          await emitRatingTipsComplete(userId, [improvementTips.tips]);
        } catch (tipsError) {
          console.warn(`[Worker] Tips failed: ${tipsError.message}`);
        }

        // ========== AWARD POINTS ==========
        try {
          const pointsAwarded = outfitScore.score > 70 ? 10 : 5;
          await awardPoints(userId, pointsAwarded, "outfit_scan");
        } catch (pointsError) {
          console.warn(`[Worker] Points failed: ${pointsError.message}`);
        }

        const finalResult = {
          score: outfitScore.score,
          message: outfitScore.message,
          breakdown: outfitScore.breakdown,
          scannedOutfit: {
            items: analysis.detectedItems,
            itemCount: analysis.detectedItems.length,
            colors: analysis.detectedItems.map(i => i.color),
            formalityLevel: analysis.formalityLevel,
            overallStyle: analysis.overallStyle
          },
          weather: {
            temperature: weatherData.temperature,
            condition: weatherData.weatherCode,
            isDay: weatherData.isDay
          },
          improvementTips,
          metadata: { userId, scanConfidence: 0.85, scannedAt: new Date().toISOString(), imageHash: imageHash.substring(0, 8) }
        };

        await emitRatingComplete(userId, { success: true, message: "Outfit scanning complete", rating: finalResult });

        return { success: true, items: analysis.detectedItems, rating: finalResult };
    } catch (error) {
        console.error(`Scan job ${job.id} failed:`, error.message);
        await emitRatingError(job.data.userId, error.message);
        throw error;
    }
    },{
        connection: scanQueuelite.opts.connection,
        concurrency: 2,
        attempts: 3,
        backoff: { type: `exponential`, delay: 5000}
    })

    console.log('Scan worker started');

    export default scanWorker