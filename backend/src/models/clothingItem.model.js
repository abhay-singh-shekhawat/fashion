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
},{timestamps : true});

const ClothingItem = mongoose.model('ClothingItem', clothingItemSchema);

export default ClothingItem;