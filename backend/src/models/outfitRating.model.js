import mongoose from 'mongoose';

/**
 * One rated fit. Both rating flows store the same normalised shape so a single
 * ScoreCard renders a live result and a remembered one, and so the retention
 * sweep only has one collection to reason about.
 */
const outfitRatingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    mode: {
        type: String,
        enum: ['photo', 'closet'],
        default: 'photo'
    },
    /* Cloudinary secure_url for uploads, the pasted link otherwise, null for
       closet combinations — there is no single photo of those. */
    imageUrl: {
        type: String,
        default: null
    },
    /* A real Cloudinary id only when we uploaded the file ourselves; a pasted
       link has no asset behind it to clean up. */
    publicId: {
        type: String,
        default: null
    },
    imageHash: {
        type: String,
        default: null
    },
    occasion: {
        type: String,
        default: 'casual'
    },
    score: {
        type: Number,
        required: true
    },
    message: {
        type: String,
        default: ''
    },
    breakdown: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    /* { itemCount, items[], colors[], formalityLevel, overallStyle } — photo
       items carry a type, closet items carry a name/category/imageUrl. */
    outfit: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    weather: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    colorHarmony: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    formality: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    improvementTips: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    isFavourite: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

outfitRatingSchema.index({ userId: 1, createdAt: -1 });
outfitRatingSchema.index({ isFavourite: 1, createdAt: 1 });

/**
 * Turn a finished rating payload into a stored item. Kept here so the photo
 * worker and the closet controller can never drift apart on the shape.
 */
outfitRatingSchema.statics.record = function record({ userId, mode = 'photo', imageUrl = null, publicId = null, imageHash = null, occasion = 'casual', result = {} }) {
    return this.create({
        userId,
        mode,
        imageUrl,
        publicId,
        imageHash,
        occasion,
        score: result.score,
        message: result.message ?? '',
        breakdown: result.breakdown ?? {},
        outfit: result.scannedOutfit ?? result.outfit ?? {},
        weather: result.weather ?? {},
        colorHarmony: result.colorHarmony ?? {},
        formality: result.formality ?? {},
        improvementTips: result.improvementTips ?? null
    });
};

const OutfitRating = mongoose.model('OutfitRating', outfitRatingSchema);

export default OutfitRating;
