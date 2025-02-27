import mongoose from "mongoose";


const slotSchema = new mongoose.Schema({
    hour: Number, // Example: 9 for 9 AM, 10 for 10 AM
    booked: { type: Boolean, default: false },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }, // Post that booked it
    bookedAt: { type: Date, default: null },
});

const Slot = mongoose.model("Slot", slotSchema);
export default Slot