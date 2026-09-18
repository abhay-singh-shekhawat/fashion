import {Worker, UnrecoverableError} from "bullmq"
import { workerOptions } from "../configs/queue.js"
import ClothingItem from "../models/clothingItem.model.js"
import BodyProfile from "../models/profile.model.js"
import OutfitRating from "../models/outfitRating.model.js"
import { awardPoints } from "../controllers/progress.controller.js"
import getWeather from "../utils/getWeather.js"
import { generateOutfitFeedback } from "../utils/generateOutfitTips.js"
import {
  calculateOutfitScore,
  estimateWeatherSuitability,
  estimateSkinToneFit,
  estimateFormalityMatch
} from "../utils/outfitScorer.js"
import { rateOutfitHarmony } from "../utils/colorHarmony.js"
import {
  emitRatingComplete,
  emitRatingError,
  emitScanProgress,
  emitRatingWeatherDone,
  emitRatingSkinToneDone,
  emitRatingHarmonyDone,
  emitRatingTipsComplete,
  emitRatingTipsStart,
  emitRatingScoreDone,
} from "../services/socketService.js"
import { generateJson, fetchImagePart } from "../utils/gemini.js"
import { getRecommendedColors } from "../utils/skinTonePalatte.js"
import { FASHION_IMAGE_RULES, NOT_FASHION_MESSAGE, readOutfitAnalysis } from "../utils/fashionImage.js"

const scanWorker = new Worker(`outfit-scan-lite`,async(job)=>{
    const { userId, imageUrl, publicId, imageHash, occasion = "casual", detailedFeedback = false, jobType } = job.data;
    try {
        /* Image-level deduplication. Rating jobs opt out: the user explicitly
           asked for a score, and returning here emitted no rating event at all,
           which left the rating screen spinning until it stalled. */
        if (jobType !== 'rating') {
            const duplicateImage = await ClothingItem.exists({ userId, imageHash });
            if (duplicateImage) {
                console.log(`Duplicate image detected for user ${userId} - skipping`);
                return { status: 'we have already told about the same outfit' };
            }
        }

        const prompt = `Analyze this outfit image in detail for a fashion app.
        ${FASHION_IMAGE_RULES}
        Return JSON only with this structure:
        {
          "isFashionImage": true or false,
          "rejectionReason": "short reason, only when isFashionImage is false",
          "detectedItems": [
            {"type": "shirt|kurti|jeans|trousers|jacket|saree|...", "color": "blue|red|...", "confidence": 0.9},
            ...
          ],
          "formalityLevel": "casual|smart_casual|formal|party|traditional",
          "layers": 1 or 2,
          "overallStyle": "brief description",
          "colorPalette": ["color1", "color2"]
        }`;

        const imagePart = await fetchImagePart(imageUrl);
        const { text: responseText } = await generateJson([{ text: prompt }, imagePart]);
        let analysis;
        try {
          analysis = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`Failed to parse Gemini response: ${parseError.message}`);
        }

        const { items: detectedItems, isFashionImage, rejectionReason } = readOutfitAnalysis(analysis);

        /* A poster is not an outfit: scoring one produced a confident-looking
           57/100 and filed it in history. UnrecoverableError stops the job here
           rather than retrying an image that will never be scorable, and the
           catch below turns it into a `rating:error` the user can read. */
        if (!isFashionImage) {
          console.warn(
            `[Rating] Job ${job.id} rejected — no clothing detected${rejectionReason ? `: ${rejectionReason}` : ''}`
          );
          throw new UnrecoverableError(NOT_FASHION_MESSAGE);
        }

        console.log(`Scan job ${job.id} completed - Item Data: ${detectedItems.length}`);

        // ========== GET WEATHER ==========
        let weatherData;
        try {
          await emitScanProgress(userId, { status: "fetching_weather", message: "Checking local weather...", progress: 60 });
          weatherData = await getWeather();
        } catch (weatherError) {
          weatherData = {
            temperature: 25,
            feelsLike: 25,
            condition: "Clear sky",
            isDay: true,
            location: "Jaipur"
          };
        }

        // ========== CALCULATE SCORES ==========
        const categories = detectedItems.map(item => item.type?.toLowerCase()).filter(Boolean);
        const tempCategory = weatherData.temperature > 28 ? "hot" : weatherData.temperature < 15 ? "cold" : "mild";
        const weatherScore = estimateWeatherSuitability(tempCategory, categories);

        /* One object feeds both the weather card and the feedback prompt. */
        const weatherForUi = {
          temperature: weatherData.temperature,
          feelsLike: weatherData.feelsLike ?? weatherData.temperature,
          condition: weatherData.condition,
          isDay: weatherData.isDay,
          location: weatherData.location,
          band: tempCategory
        };

        await emitRatingWeatherDone(userId, weatherScore, weatherForUi);

        let skinToneScore = 0;
        const bodyProfile = await BodyProfile.findOne({ user: userId });
        if (bodyProfile?.skinTone && bodyProfile.skinTone !== 'unknown') {
          const colors = detectedItems.map(item => item.color);
          const palette = await getRecommendedColors(bodyProfile.skinTone);
          skinToneScore = estimateSkinToneFit(bodyProfile.skinTone, colors, palette);
          await emitRatingSkinToneDone(userId, skinToneScore, { skinTone: bodyProfile.skinTone });
        }

        /* Colour harmony and formality are judged from what was actually
           detected — how many pairs of colours clash, and how far the outfit's
           formality sits from the occasion the user picked. */
        const harmony = rateOutfitHarmony(detectedItems.map(item => item.color));
        const formality = estimateFormalityMatch({
          occasion,
          formalityLevel: analysis.formalityLevel
        });

        await emitRatingHarmonyDone(userId, harmony.score, { explanation: harmony.note });

        /* One object each feeds the panel facts and the feedback prompt. */
        const colorHarmonyForUi = {
          colors: harmony.colors,
          pairs: harmony.pairs,
          note: harmony.note
        };

        const formalityForUi = {
          occasion: formality.occasion,
          detected: formality.detected,
          wanted: formality.wanted,
          note: formality.note
        };

        const outfitScore = calculateOutfitScore({
          colorHarmonyScore: harmony.score,
          skinToneFit: skinToneScore,
          weatherSuitability: weatherScore,
          formalityMatch: formality.score,
          isScanned: true,
          scanConfidence: 0.85
        });

        await emitRatingScoreDone(userId, outfitScore.score, outfitScore.message, outfitScore.breakdown);

        // ========== STRUCTURED FEEDBACK ==========
        let improvementTips = null;
        try {
          await emitScanProgress(userId, { status: "generating_tips", message: "Writing your fit notes...", progress: 75 });
          await emitRatingTipsStart(userId, detailedFeedback);

          const feedback = await generateOutfitFeedback({
            outfitScore,
            detectedItems: detectedItems,
            weather: weatherForUi,
            colorHarmony: colorHarmonyForUi,
            formality: formalityForUi,
            userProfile: bodyProfile || {},
            occasion,
            detailed: detailedFeedback
          });

          improvementTips = {
            /* Plain-text fallback for older clients and for the RateSaved screen. */
            tips: feedback.paragraph ?? feedback.quickWins ?? [],
            feedback: {
              headline: feedback.headline,
              sections: feedback.sections,
              quickWins: feedback.quickWins
            },
            mode: feedback.mode,
            model: feedback.model
          };

          await emitRatingTipsComplete(userId, [improvementTips.tips], improvementTips.feedback);
        } catch (tipsError) {
          console.warn(`[Worker] Feedback failed: ${tipsError.message}`);
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
            items: detectedItems,
            itemCount: detectedItems.length,
            colors: detectedItems.map(i => i.color),
            formalityLevel: analysis.formalityLevel,
            overallStyle: analysis.overallStyle
          },
          /* The rated photo travels with the result so the panel can show what
             was scored, not just the numbers. */
          imageUrl,
          weather: weatherForUi,
          colorHarmony: colorHarmonyForUi,
          formality: formalityForUi,
          improvementTips,
          metadata: { userId, scanConfidence: 0.85, scannedAt: new Date().toISOString(), imageHash: imageHash.substring(0, 8) }
        };

        /* Only real ratings belong in history — this worker also runs scan jobs.
           Storing is best-effort: failing to remember a fit must never lose the
           rating the user is waiting for. */
        if (jobType === 'rating') {
          try {
            const stored = await OutfitRating.record({
              userId,
              mode: 'photo',
              imageUrl,
              publicId,
              imageHash,
              occasion,
              result: finalResult
            });
            finalResult.metadata.ratingId = stored._id;
          } catch (historyError) {
            console.warn(`[Worker] Rating history save failed: ${historyError.message}`);
          }
        }

        await emitRatingComplete(userId, { success: true, message: "Outfit scanning complete", rating: finalResult });

        return { success: true, items: detectedItems, rating: finalResult };
    } catch (error) {
        console.error(`Scan job ${job.id} failed:`, error.message);
        await emitRatingError(job.data.userId, error.message);
        throw error;
    }
    },{
        ...workerOptions,
        concurrency: 2
    })

    console.log('Scan worker started');

    export default scanWorker