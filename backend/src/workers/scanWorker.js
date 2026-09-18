import {Worker} from "bullmq"
import { workerOptions } from "../configs/queue.js"
import ClothingItem from "../models/clothingItem.model.js"
import { awardPoints } from "../controllers/progress.controller.js"
import { invalidateWardrobeCaches } from "../controllers/wardrobe.controller.js"
import { generateJson, fetchImagePart } from "../utils/gemini.js"
import { FASHION_IMAGE_RULES, NOT_FASHION_MESSAGE, readOutfitAnalysis } from "../utils/fashionImage.js"
import {
  emitScanProgress,
  emitScanItemsDetected,
  emitScanComplete,
  emitScanError,
} from "../services/socketService.js"

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
  const t = type.toLowerCase().trim().replace(/[\s-]+/g, '_');
  return CATEGORY_MAP[t] || 'other';
}

/* Gemini returns free text ("semi-formal", "Smart Casual"). Anything outside
   the schema enum fails mongoose validation and would abort the whole job
   *after* the upload, so unknown values fall back to `unknown`. */
const ALLOWED_FORMALITIES = ['casual', 'smart_casual', 'formal', 'business', 'party', 'sporty', 'traditional'];

const asFormality = (value) => {
  const v = String(value || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  return ALLOWED_FORMALITIES.includes(v) ? v : 'unknown';
}

const asConfidence = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.85;
}

const scanWorker = new Worker(`outfit-scan`,async(job)=>{
    const { userId, imageUrl, publicId, imageHash } = job.data;
    try {
        /* Both dedupe paths must still answer the client: returning silently
           left the app waiting on a completion event that never came. */
        const alreadyProcessed = await ClothingItem.exists({ publicId });
        if (alreadyProcessed) {
            console.log(`Job ${job.id} already processed - skipping duplicate`);
            await emitScanComplete(userId, {
                jobId: publicId,
                itemsAdded: 0,
                items: [],
                message: "This photo is already in your closet"
            });
            return { status: 'already_processed' };
        }

        // Image-level deduplication (best-effort pre-check)
        const duplicateImage = await ClothingItem.exists({ userId, imageHash });
        if (duplicateImage) {
            console.log(`Duplicate image detected for user ${userId} - skipping`);
            await emitScanComplete(userId, {
                jobId: publicId,
                itemsAdded: 0,
                items: [],
                message: "This photo is already in your closet"
            });
            return { status: 'duplicate_image' };
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

        await emitScanProgress(userId, {
            status: "downloading",
            message: "Fetching your photo...",
            progress: 60
        });

        const imagePart = await fetchImagePart(imageUrl);

        await emitScanProgress(userId, {
            status: "analyzing",
            message: "AI is identifying each piece...",
            progress: 75
        });

        const { text: responseText } = await generateJson([{ text: prompt }, imagePart]);
        let analysis;
        try {
          analysis = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`Failed to parse Gemini response: ${parseError.message}`);
        }

        const { items: detectedItems, isFashionImage, rejectionReason } = readOutfitAnalysis(analysis);

        /* A photo with no clothes in it (poster, screenshot, food) used to be
           "scanned" into an empty closet and reported as a success. Nothing is
           saved and no points are awarded — the user is told why instead. */
        if (!isFashionImage) {
            console.warn(
                `Scan job ${job.id} rejected — no clothing detected${rejectionReason ? `: ${rejectionReason}` : ''}`
            );
            await emitScanItemsDetected(userId, []);
            await emitScanError(userId, NOT_FASHION_MESSAGE);
            return { status: 'not_fashion_image' };
        }

        const savedItems = [];
        const globalFormality = asFormality(analysis?.formalityLevel);

        await emitScanItemsDetected(userId, detectedItems);

        await emitScanProgress(userId, {
            status: "saving",
            message: `Saving ${detectedItems.length} piece${detectedItems.length === 1 ? '' : 's'} to your closet...`,
            progress: 90
        });

        for (const item of detectedItems) {
            const category = asCategory(item.type);

            /* The unique { userId, imageHash } index would reject every item
               after the first from the same photo, so only the first saved
               item carries the hash — the rest stay out of the sparse index
               while the whole image is still deduplicated by that first hash. */
            const itemData = {
                userId,
                name: `${item.color || 'unknown'} ${item.type || 'item'}`,
                category: category,
                color: item.color || 'unknown',
                formality: globalFormality,
                imageUrl: imageUrl,           // from Cloudinary
                publicId: publicId,           // from Cloudinary + job
                detectedBy: 'scanner',
                confidence: asConfidence(item.confidence)
            };
            if (savedItems.length === 0) {
              itemData.imageHash = imageHash;
            }

            const newItem = new ClothingItem(itemData);
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
          await invalidateWardrobeCaches(userId);
        }

        console.log(`Scan job ${job.id} completed - ${savedItems.length} items added`);

        await emitScanComplete(userId, {
            jobId: publicId,
            itemsAdded: savedItems.length,
            items: savedItems,
            duration: Date.now() - job.timestamp
        });

        return { success: true, itemsAdded: savedItems.length };
    } catch (error) {
        console.error(`Scan job ${job.id} failed:`, error.message);
        await emitScanError(userId, error.message);
        throw error;
    }
    },{
        ...workerOptions,
        concurrency: 2
    })

    console.log('Scan worker started');

    export default scanWorker