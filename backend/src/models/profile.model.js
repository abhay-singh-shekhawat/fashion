import mongoose from "mongoose";

const bodyProfileSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    heightCm: {
        type: Number,
        min: 100,
        max: 250,
        required: true
    },
    weightKg: {
        type: Number,
        min: 30,
        max: 200,
        required: true
    },
    age: {
        type: Number,
        min: 12,
        max: 100,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
        default: 'prefer_not_to_say'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

bodyProfileSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next
});

const BodyProfile = mongoose.model("BodyProfile", bodyProfileSchema);

export default BodyProfile;