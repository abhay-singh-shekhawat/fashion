import {Worker} from "bullmq"
import { scanQueue } from "../configs/queue.js"
import ClothingItem from "../models/clothingItem.model.js"
import { awardPoints } from "../controllers/progress.controller.js"
import crypto from "crypto"
import {GoogleGenerativeAI} from "@google/generative-ai"

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Map detected item types to wardrobe categories
const CATEGORY_MAP = {
  shirt: 'top',
  tshirt: 'top',
  t_shirt: 'top',
  top: 'top',
  kurti: 'traditional',
  saree: 'traditional',
  dress: 'one_piece',
  gown: 'one_piece',
  jeans: 'bottom',
  trousers: 'bottom',
  pants: 'bottom',
  shorts: 'bottom',
  jacket: 'outerwear',
  hoodie: 'outerwear',
  blazer: 'outerwear',
  coat: 'outerwear',
  sweater: 'outerwear',
  cardigan: 'outerwear',
  sherwani: 'traditional',
  kurta: 'traditional',
  salwar: 'bottom',
  pajama: 'bottom',
  footwear: 'footwear',
  shoes: 'footwear'
};

const asCategory = (type) => {
  if (!type || typeof type !== 'string') return 'other';
  const t = type.toLowerCase().replace(/\s+/g, '_');
  return CATEGORY_MAP[t] || 'other';
}

const scanWorker = new Worker(`outfit-scan`,async(job)=>{
    const { userId, imageUrl, publicId, imageHash } = job.data;
    try {
        const alreadyProcessed = await ClothingItem.exists({ publicId });
        if (alreadyProcessed) {
            console.log(`Job ${job.id} already processed - skipping duplicate`);
            return { status: 'already_processed' };
        }

        // Image-level deduplication (best-effort pre-check)
        const duplicateImage = await ClothingItem.exists({ userId, imageHash });
        if (duplicateImage) {
            console.log(`Duplicate image detected for user ${userId} - skipping`);
            return { status: 'duplicate_image' };
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

        const savedItems = [];
        const globalFormality = analysis?.formalityLevel || 'unknown';

        for (const item of Array.isArray(analysis?.detectedItems) ? analysis.detectedItems : []) {
            const category = asCategory(item.type);
            const newItem = new ClothingItem({
                userId,  
                name: `${item.color} ${item.type}`,
                category: category,
                color: item.color || 'unknown',
                formality: globalFormality || 'unknown',
                imageUrl: imageUrl,           // from Cloudinary
                publicId: publicId,           // from Cloudinary + job
                imageHash: imageHash,         // for deduplication
                detectedBy: 'scanner',
                confidence: typeof item.confidence === 'number' ? item.confidence : 0.85
            });
            try {
              await newItem.save();
              savedItems.push(newItem);
            } catch (saveErr) {
              // Handle duplicate key errors gracefully (unique index on userId+imageHash)
              if (saveErr?.code === 11000) {
                console.warn(`Duplicate detected while saving item for job ${job.id}:`, saveErr.message);
                continue;
              }
              throw saveErr;
            }
        }

        if (savedItems.length > 0) {
          await awardPoints(userId, 15, 'outfit_scanned');
        }

        console.log(`Scan job ${job.id} completed - ${savedItems.length} items added`);
        return { success: true, itemsAdded: savedItems.length };
    } catch (error) {
        console.error(`Scan job ${job.id} failed:`, error.message);
        throw error;
    }
    },{
        connection: scanQueue.opts.connection,
        concurrency: 2,
        attempts: 3,
        backoff: { type: `exponential`, delay: 5000}
    })

    console.log('Scan worker started');

    export default scanWorker