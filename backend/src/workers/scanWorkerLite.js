import {Worker} from "bullmq"
import { scanQueuelite } from "../configs/queue.js"
import ClothingItem from "../models/clothingItem.model.js"
import { awardPoints } from "../controllers/progress.controller.js"
import crypto from "crypto"
import {GoogleGenerativeAI} from "@google/generative-ai"

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const scanWorker = new Worker(`process-scan`,async(job)=>{
    const { userId, imageUrl, publicId, imageHash } = job.data;
    try {
        // Image-level deduplication
        const duplicateImage = await ClothingItem.exists({ userId, imageHash });
        if (duplicateImage) {
            console.log(`Duplicate image detected for user ${userId} - skipping`);
            return { status: 'we have already told about the same outfit' };
        }

        const model = genAi.getGenerativeModel({model: `gemini-3.1-flash-lite`})
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
        return { success: true, items: analysis.detectedItems};
    } catch (error) {
        console.error(`Scan job ${job.id} failed:`, error.message);
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