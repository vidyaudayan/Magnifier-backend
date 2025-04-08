import mongoose from "mongoose";

const slotReservationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true,
  },
  postId: {  
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  },
  startHour: {
    type: Number,
    required: true, min: 0,
    max: 23
  },
  endHour: {
    type: Number,
    required: true, min: 0,
    max: 23
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  paymentIntent: {  
    type: String
  },
  expiresAt: {  
    type: Date
  }
});

const SlotReservation = mongoose.model("SlotReservation", slotReservationSchema);

export default SlotReservation;
