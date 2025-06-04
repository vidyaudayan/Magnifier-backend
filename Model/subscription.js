// models/Subscription.js
import mongoose from "mongoose";

const subscriptionPlanEnum = ['basic', 'premium', 'pro'];

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    voterMagnifier: {
      plan: {
        type: String,
        enum: subscriptionPlanEnum,
        default: 'basic'
      },
      isActive: { type: Boolean, default: false },
      startedAt: { type: Date },
      expiresAt: { type: Date }
    },
    mediaMagnifier: {
      plan: {
        type: String,
        enum: subscriptionPlanEnum,
        default: 'basic'
      },
      isActive: { type: Boolean, default: false },
      startedAt: { type: Date },
      expiresAt: { type: Date }
    }
  },
  { timestamps: true }
);

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
