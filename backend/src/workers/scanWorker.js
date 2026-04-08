import {Worker} from "bullmq"
import { scanQueue } from "../configs/queue.js"
import ClothingItem from "../models/clothingItem.model.js"
import { awardPoints } from "../controllers/progress.controller.js"
import crypto from "crypto"

const scanWorker = new Worker(`outfit-scan`,async(job)=>{
    const { userId, imageUrl, publicId, imageHash } = job.data;
    try {
        const alreadyProcessed = await ClothingItem.exists({ publicId });
        if (alreadyProcessed) {
            console.log(`Job ${job.id} already processed - skipping duplicate`);
            return { status: 'already_processed' };
        }

        // Image-level deduplication
        const duplicateImage = await ClothingItem.exists({ userId, imageHash });
        if (duplicateImage) {
            console.log(`Duplicate image detected for user ${userId} - skipping`);
            return { status: 'duplicate_image' };
        }
        await new Promise(resolve => setTimeout(resolve,3000))

        // Fake detection (will be replaced with real CV)
        const detection = {
            detectedItems: [
            { type: 'shirt', color: 'blue', confidence: 0.92 },
            { type: 'jeans', color: 'black', confidence: 0.88 }
        ],
        formalityLevel: 'casual'
        };
        const savedItems = [];
        for (const item of detection.detectedItems) {
            const newItem = new ClothingItem({
                userId,
                name: `${item.color} ${item.type}`,
                category: item.type === 'shirt' ? 'top' : 'bottom',
                color: item.color,
                formality: detection.formalityLevel,
                imageUrl: imageUrl,           // from Cloudinary
                publicId: publicId,           // from Cloudinary + job
                imageHash: imageHash,         // for deduplication
                detectedBy: 'scanner',
                confidence: item.confidence
            });
            await newItem.save();
            savedItems.push(newItem);
        }

        await awardPoints(userId, 15, 'outfit_scanned');

        console.log(`Scan job ${job.id} completed - ${savedItems.length} items added`);
        return { success: true, itemsAdded: savedItems.length };
    } catch (error) {
        console.error(`Scan job ${job.id} failed:`, error.message);
        throw error;
    }
    },{
        connection: scanQueue.opts.connection,
        concurrency: 2,
        attemps: 3,
        backoff: { type: `exponential`, delay: 5000}
    })

    console.log('Scan worker started');

    export default scanWorker