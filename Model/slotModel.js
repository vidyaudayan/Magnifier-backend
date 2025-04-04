import mongoose from "mongoose";


const slotSchema = new mongoose.Schema({
    hour:  { type: Number, required: true, min: 0, max: 23 },
    booked: { type: Boolean, default: false },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }, 
    bookedAt: { type: Date, default: null },
},{ timestamps: true });

const Slot = mongoose.model("Slot", slotSchema);
export default Slot