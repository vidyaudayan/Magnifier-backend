import mongoose from "mongoose";


{/*st slotSchema = new mongoose.Schema({
    hour:  { type: Number, required: true, min: 0, max: 23 },
    booked: { type: Boolean, default: false },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }, 
    bookedAt: { type: Date, default: null },
    duration: {
        type: Number,
        enum: [1, 3, 6, 12], // Only allow these durations
        required: true
      },
      startHour: {
        type: Number,
        min: 0,
        max: 24,
    
      },
      endHour: {
        type: Number,
        min: 1,
        max: 24,
        required: true
      },
      type: {
        type: String,
        enum: ['1-hour', '3-hour', '6-hour', '12-hour']
      }

},{ timestamps: true,strict: true  });

const Slot = mongoose.model("Slot", slotSchema);
export default Slot*/}

const slotSchema = new mongoose.Schema({
    hour: { 
        type: Number, 
        required: true, 
        min: 0, 
        max: 23 
    },
    booked: { 
        type: Boolean, 
        default: false 
    },
    bookedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User"  // Changed from "Post" to "User" since a user books the slot
    }, 
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    },
    bookedAt: { 
        type: Date 
    },stickyUntil: {  
        type: Date,
        index: true
    },
    bookingGroupId: { 
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },
    expiresAt: {  
        type: Date,
        index: { expires: 0 } 
    },
    duration: {
        type: Number,
        enum: [1, 3, 6, 12],
        required: true
    },
    startHour: {
        type: Number,
        min: 0,
        max: 23, 
        required: true
    },
    endHour: {
        type: Number,
        min: 1,
        max: 24,
        required: true,
        validate: {  
            validator: function(value) {
                return value > this.startHour;
            },
            message: 'End hour must be after start hour'
        }
    },
    bookingGroupId: {  
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },
    type: {
        type: String,
        enum: ['1-hour', '3-hour', '6-hour', '12-hour'],
        required: true
    }
}, { 
    timestamps: true,
    strict: true  
});

// Compound index to prevent double bookings
slotSchema.index(
    { startHour: 1, endHour: 1, booked: 1, expiresAt: 1 },
    { unique: true, partialFilterExpression: { booked: true } }
);

const Slot = mongoose.model("Slot", slotSchema);
export default Slot