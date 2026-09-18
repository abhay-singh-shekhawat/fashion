import mongoose from 'mongoose';
import { RECOMMENDATION_RETENTION_DAYS } from '../utils/recommendationHistory.js';

/* What the app recommended, per user, per day. The daily pick reads this back
   to avoid repeating itself; nothing else depends on a record, so Mongoose
   expires them on their own instead of needing a sweep job. */
const outfitSuggestionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    itemIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClothingItem'
    }],
    itemKey: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    occasion: {
        type: String,
        default: 'daily'
    },
    temperature: Number,
    source: {
        type: String,
        enum: ['ai', 'wardrobe'],
        default: 'wardrobe'
    },
}, { timestamps: true });

/* Repeat lookup: "was this exact look suggested in the last few days?" */
outfitSuggestionSchema.index({ userId: 1, itemKey: 1, createdAt: -1 });

outfitSuggestionSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: RECOMMENDATION_RETENTION_DAYS * 24 * 60 * 60 }
);

const OutfitSuggestion = mongoose.model('OutfitSuggestion', outfitSuggestionSchema);

export default OutfitSuggestion;
