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
     voterMagnifier: {
      isActive: { type: Boolean, default: false },
      startAt:{type:Date},
      expiresAt: { type: Date }
    },
    mediaMagnifier: {
      isActive: { type: Boolean, default: false },
      startAt:{type:Date},
      expiresAt: { type: Date }
    },
    earnedPoints: {
      type: Number,
      default: 35
    },
    rechargedPoints: {
      type: Number,
      default: 75,
    },
    walletTransactions: [
    {
      type: {
        type: String,
        enum: ['earn', 'recharge', 'withdraw', 'pinned_post']
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
       referenceModel: {
          type: String,
          enum: ['Post', 'Payment']
        },
       balanceAfter: Number,
      description: String,
   reference: {
          type: mongoose.Schema.Types.Mixed,
          refPath: 'walletTransactions.referenceModel'
        },
    }
  ],
    reactions: [  
      {
          postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, // Refers to the post
          reactionType: { type: String, enum: ['like', 'dislike'] },   // Reaction type
          reactedAt: { type: Date, default: Date.now }                // When the reaction was made
      }
  ],
  // OTP Fields for Email Verification
  otp: { type: String }, // Stores the generated OTP
  otpExpiration: { type: Date }, // OTP Expiry Time
  isVerified: { type: Boolean, default: false }, // To check if email is verified

    resetToken: String,
    resetTokenExpiration: Date, 
    posts: [ 
        {
        type: mongoose.Schema.Types.ObjectId, ref: 'Post'
        }
      ]
   
  },
  { timestamps : true,toJSON: { virtuals: true },
    toObject: { virtuals: true } }
);
// Virtual for total points
userSchema.virtual('totalPoints').get(function() {
  return this.earnedPoints + this.rechargedPoints;
});

// Index for wallet transactions
userSchema.index({ 'walletTransactions.timestamp': -1 });

const User = mongoose.model("User", userSchema);
export default User;