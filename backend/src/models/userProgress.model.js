import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    totalOutfitsSuggested: {
        type: Number,
        default: 0
    },
    totalWardrobeItems: {
        type: Number,
        default: 0
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    lastSuggestionDate: {
        type: Date,
        default: null
    },
    totalPoints: {
        type: Number,
        default: 0
    }
},{timestamps : true});

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

export default UserProgress;