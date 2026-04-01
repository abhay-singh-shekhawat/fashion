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
        enum: ['top', 'bottom', 'outerwear', 'footwear', 'accessory', 'other'],
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

const ClothingItem = mongoose.model('ClothingItem', clothingItemSchema);

export default ClothingItem;