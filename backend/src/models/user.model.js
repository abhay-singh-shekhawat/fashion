import mongoose from "mongoose";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        default: null
    }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    this.password = await bcrypt.hash(this.password, 10);
    next
});
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
userSchema.methods.generateAccessToken = function() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};
userSchema.methods.generateRefreshToken = function() {
    const refreshToken = jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    this.refreshToken = refreshToken;
    this.save();
    return refreshToken;
}

const User = mongoose.model("User", userSchema);

export default User;