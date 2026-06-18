import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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
        type: [String],
        default: []
    }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    try {
      if (this.isModified && this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
      }
    } catch (err) {
      return next(err);
    }
});

// Attach instance methods directly so they are always available
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    const match = await bcrypt.compare(candidatePassword, this.password);
    return match;
  } catch (err) {
    throw err;
  }
};

userSchema.methods.generateAccessToken = function () {
  try {
    const payload = { userId: this._id.toString(), email: this.email };
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const token = jwt.sign(payload, secret, { expiresIn: '1d' });
    return token;
  } catch (err) {
    throw err;
  }
};

userSchema.methods.generateRefreshToken = function () {
  try {
    const payload = { userId: this._id.toString(), email: this.email };
    const secret = process.env.REFRESH_TOKEN_SECRET || process.env.REFRESH_SECRET || 'refreshsecret';
    const token = jwt.sign(payload, secret, { expiresIn: '30d' });
    return token;
  } catch (err) {
    throw err;
  }
};

const User = mongoose.model("User", userSchema);

export default User;