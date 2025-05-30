import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    username: { type: String },
    profilePic: { type: String, default: "" },
    coverPic: { type: String, default: "" },
    fathersName: { type: String },
    age: { type: Number, required: true },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'male', 'female', 'other']
    },
    vidhanSabha: { type: String },
    wardNumber: { type: Number },
    phoneNumber: { type: String },
    isPhoneVerified: { type: Boolean, default: false },
    phoneOtp: { type: String },
    phoneOtpExpiration: { type: Date },
    state: {
      type: String,
      required: true,
      enum: ['Delhi', 'Bihar', 'West Bengal'],
      default: 'Delhi'
    },
    email: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },

    password: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    deactivatedAt: { type: Date, default: null },

    walletAmount: { type: Number, default: 0 },
    isFirstLogin: { type: Boolean, default: true },
    earnedPoints: {
      type: Number,
      default: 0
    },
    rechargedPoints: {
      type: Number,
      default: 0
    },
    walletTransactions: [
      {
        type: {
          type: String,
          enum: ['earn', 'recharge', 'withdraw']
        },
        amount: Number,
        status: {
          type: String,
          enum: ['pending', 'success', 'failed'],
          default: 'pending'
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        description: String,
        reference: String
      }
    ],
    reactions: [
      {
        postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
        reactionType: { type: String, enum: ['like', 'dislike'] },
        reactedAt: { type: Date, default: Date.now }
      }
    ],

    // OTP Fields for Email Verification
    otp: { type: String },
    otpExpiration: { type: Date },
    isVerified: { type: Boolean, default: false },

    resetToken: String,
    resetTokenExpiration: Date,

    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
      }
    ],

    subscriptions: {
      voterMagnifier: {
        plan: {
          type: String,
          enum: ['basic', 'premium', 'pro'],
          default: 'basic'
        },
        isActive: { type: Boolean, default: false },
        startedAt: { type: Date },
        expiresAt: { type: Date }
      },
      mediaMagnifier: {
        plan: {
          type: String,
          enum: ['basic', 'premium', 'pro'],
          default: 'basic'
        },
        isActive: { type: Boolean, default: false },
        startedAt: { type: Date },
        expiresAt: { type: Date }
      }
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
