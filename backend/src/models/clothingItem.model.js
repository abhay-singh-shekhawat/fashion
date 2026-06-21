import mongoose from 'mongoose';

const clothingItemSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : "User",
        index: true
    },
    name: {          
        type: String,
        required: true,
        trim: true
    },
    category: { // hard coded for prototype
        type: String,
        enum: ['top', 'bottom', 'outerwear', 'footwear', 'accessory', 'other', 'one_piece', 'traditional'],
        required: true
    },
    color: {
        type: String,
        default: 'unknown'
    },
    formality: {
        type: String,
        enum: ['casual', 'smart_casual', 'formal', 'business', 'party', 'sporty', 'traditional', 'unknown'],
        default: 'unknown'
    },
    imageUrl: {
        type: String,
        default: null
    },
    publicId: { 
        type: String, 
        required: true 
    },
    imageHash: {
        type: String,
        index: true
    },
    detectedBy: {
        type: String,
        enum: ['manual', 'scanner', 'ai'],
        default: 'manual'
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.85
    },
},{timestamps : true});

// Compound unique index to prevent duplicate inserts for same user + imageHash
// sparse: true allows documents without imageHash (if any legacy doc)
clothingItemSchema.index({ userId: 1, imageHash: 1 }, { unique: true, sparse: true });

const ClothingItem = mongoose.model('ClothingItem', clothingItemSchema);

export default ClothingItem;