import mongoose from "mongoose";


const userSchema = new mongoose.Schema(
  {
    name: { type: String, },
    username: { type: String,  },
    profilePic: { type: String, default: "" },
    coverPic: { type: String, default: "" },
    fathersName: { type: String },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other', 'male', 'female', 'other'] },
    vidhanSabha: { type: String },
    wardNumber: { type: Number },
    phoneNumber: { type: String,  }, // Add phone number field
    isPhoneVerified: { type: Boolean, default: false }, // Status for mobile verification
    phoneOtp: { type: String }, // Stores the generated mobile OTP
    phoneOtpExpiration: { type: Date }, // Expiration for mobile OTP
    state: { 
      type: String, 
      required: true,
      enum: ['Delhi', 'Bihar', 'West Bengal'], 
      default: 'Delhi' 
    },
    email: { type: String, required: true,  },
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
  { timestamps : true }
);

const User = mongoose.model("User", userSchema);
export default User;