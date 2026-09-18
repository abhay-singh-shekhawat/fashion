import { Worker } from "bullmq"
import { workerOptions } from "../configs/queue.js"
import BodyProfile from "../models/profile.model.js"
import { generateJson, fetchImagePart } from "../utils/gemini.js"
import {
  emitSkinToneProgress,
  emitSkinToneComplete,
  emitSkinToneError,
} from "../services/socketService.js"

const VALID_SKIN_TONES = ['warm', 'cool', 'neutral', 'olive', 'unknown']

const skinToneWorker = new Worker(`skintone-scan`, async (job) => {
  const { userId, imageUrl } = job.data;
  try {
    // Emit processing started
    await emitSkinToneProgress(userId, 20, "Analyzing skin tone from image...");

    // Call Gemini with a skin-tone analysis prompt
    const prompt = `Analyze this portrait image and determine the skin tone undertone.
      Return JSON ONLY with this exact structure:
      {
        "skinTone": "warm|cool|neutral|olive|unknown",
        "confidence": 0.0 to 1.0,
        "description": "brief 1-line analysis"
      }
      Rules:
      - 'warm' = golden/yellow/peachy undertones
      - 'cool' = pink/rosy/blue undertones
      - 'neutral' = balanced mix
      - 'olive' = greenish/earthy undertone
      - 'unknown' = cannot determine from image`;

    const imagePart = await fetchImagePart(imageUrl);
    const { text: responseText } = await generateJson([{ text: prompt }, imagePart]);
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Failed to parse Gemini skin tone response: ${parseError.message}`);
    }

    const skinTone = analysis?.skinTone || 'unknown';
    const confidence = typeof analysis?.confidence === 'number' ? analysis.confidence : 0;

    if (!VALID_SKIN_TONES.includes(skinTone)) {
      throw new Error(`Invalid skin tone value returned: ${skinTone}`);
    }

    // Emit progress - updating profile
    await emitSkinToneProgress(userId, 70, "Updating your profile...");

    // Save to BodyProfile — field names must match profile.model.js exactly
    const profile = await BodyProfile.findOneAndUpdate(
      { user: userId },
      { $set: { skinTone, updatedAt: Date.now() } },  // findOneAndUpdate doesn't trigger pre('save')
      { new: true, runValidators: true }
    );

    if (!profile) {
      throw new Error(`BodyProfile not found for user ${userId}`);
    }

    // Emit completion with full result
    await emitSkinToneComplete(userId, {
      success: true,
      skinTone,
      confidence,
      description: analysis?.description || '',
      updatedAt: new Date().toISOString()
    });

    return { success: true, skinTone, confidence };
  } catch (error) {
    console.error(`Skin tone job ${job.id} failed:`, error.message);
    await emitSkinToneError(job.data.userId, error.message);
    throw error;  // let BullMQ retry
  }
}, {
  ...workerOptions,
  concurrency: 2
})

console.log('Skin tone worker started');

export default skinToneWorker