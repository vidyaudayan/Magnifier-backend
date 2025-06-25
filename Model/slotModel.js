import mongoose from "mongoose";


{/*const slotSchema = new mongoose.Schema({
  date: {
    type: Date,
      required: true,
    index: true,
     validate: {
      validator: function(v) {
        // Ensure date is at midnight UTC
        return v.getUTCHours() === 0 && 
               v.getUTCMinutes() === 0 && 
               v.getUTCSeconds() === 0;
      },
      message: 'Date must be at UTC midnight'
    }
  },
  startHour: {
    type: Number,
    required: true,
    min: 0,
    max: 23
  },
  endHour: {
    type: Number,
    required: true,
    min: 1,
    max: 24,
    validate: {
      validator: function(value) {
        return value > this.startHour;
      },
      message: 'End hour must be after start hour'
    }
  },
  version: {
    type: Number,
    default: 0
  },
  reserved: {
  type: Boolean,
  default: false
},
reservedAt: Date,
reservedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User"
},

  duration: {
    type: Number,
    enum: [1, 3, 6, 12],
    required: true
  },
  booked: {
    type: Boolean,
    default: false
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  },
  bookedAt: Date,
  stickyUntil: Date,
  expiresAt: {
    type: Date,
    index: { expires: 0 }
  }
}, {
  timestamps: true
});

// Enhanced compound index to prevent overlapping bookings
slotSchema.index(
  { date: 1, startHour: 1, endHour: 1, booked: 1 },
  { unique: true, partialFilterExpression: { booked: true } }
);
slotSchema.index({
  date: 1,
  startHour: 1,
  booked: 1,
  expiresAt: 1
});

slotSchema.index({
  date: 1,
  startHour: 1,
  reserved: 1,
  expiresAt: 1
});

// Add pre-save hook to validate no overlaps
slotSchema.pre('save', async function(next) {
  if (this.booked) {
    const overlapping = await this.constructor.findOne({
      date: this.date,
      booked: true,
      $or: [
        { 
          startHour: { $lt: this.endHour },
          endHour: { $gt: this.startHour }
        },
        {
          // Also check if new slot would completely contain an existing slot
          $and: [
            { startHour: { $gte: this.startHour } },
            { endHour: { $lte: this.endHour } }
          ]
        }
      ],
      _id: { $ne: this._id }
    });

    if (overlapping) {
      const err = new Error('This time slot overlaps with an existing booking');
      err.name = 'OverlappingSlotError';
      return next(err);
    }
  }
  next();
});*/}

{/*const slotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true,
    validate: {
      validator: function(v) {
        return v.getUTCHours() === 0 && v.getUTCMinutes() === 0 && v.getUTCSeconds() === 0;
      },
      message: 'Date must be at UTC midnight'
    }
  },
  startHour: { type: Number, required: true, min: 0, max: 23 },
  endHour: { type: Number, required: true, min: 1, max: 24 },
  duration: { type: Number, enum: [1, 3, 6, 12], required: true },
  booked: { type: Boolean, default: false, index: true },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  postId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Post",
    required: false,
    default: null,
    index: { sparse: true } // Changed to sparse index
  },
  bookedAt: Date,
  stickyUntil: Date,  
}, { 
  timestamps: true,
  minimize: false
});

// Compound unique index for slots
slotSchema.index({ 
  date: 1, 
  startHour: 1, 
  endHour: 1 
}, { unique: true });

// Other indexes
slotSchema.index({ date: 1, startHour: 1, duration: 1 });
slotSchema.index({ bookedBy: 1, booked: 1 });
slotSchema.index({ stickyUntil: 1 }, { expireAfterSeconds: 0 });

// In your slotSchema definition
slotSchema.pre('save', async function(next) {
  // Skip if this is an update to an existing document
  if (!this.isNew) {
    return next();
  }

  const existingSlot = await this.constructor.findOne({
    date: this.date,
    startHour: this.startHour,
    endHour: this.endHour
  });

  if (existingSlot) {
    // If the existing slot is booked, throw error
    if (existingSlot.booked) {
      return next(new Error(`Slot ${this.startHour}-${this.endHour} on ${this.date} already exists and is booked`));
    }
    // If not booked, we can update it
    this._id = existingSlot._id;
    this.isNew = false;
  }
  next();

  slotSchema.statics = {
  cleanDuplicateSlots: async function() {
    try {
    // Find all duplicate slots
    const duplicates = await Slot.aggregate([
      {
        $group: {
          _id: {
            date: "$date",
            startHour: "$startHour",
            endHour: "$endHour"
          },
          ids: { $push: "$_id" },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    // Keep the first document and delete others
    for (const group of duplicates) {
      const idsToDelete = group.ids.slice(1); // Keep first, delete rest
      await Slot.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`Deleted ${idsToDelete.length} duplicates for ${group._id.date} ${group._id.startHour}-${group._id.endHour}`);
    }

    return { success: true, duplicatesFixed: duplicates.length };
  } catch (error) {
    console.error('Error cleaning duplicates:', error);
    throw error;
  }},
  
  createSlotIndexes: async function() {
    try {
    // First check if index exists
    const indexes = await Slot.collection.indexes();
    const indexExists = indexes.some(index => 
      index.key.date && index.key.startHour && index.key.endHour && index.unique
    );

    if (!indexExists) {
      // Create the index with background: true to minimize impact
      await Slot.collection.createIndex(
        { date: 1, startHour: 1, endHour: 1 },
        { 
          unique: true,
          background: true,
          name: 'unique_slot_times'
        }
      );
      console.log('✅ Created unique index on slot times');
    } else {
      console.log('ℹ️ Unique index already exists');
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  } 
  },
  
  safeMigration: async function() {
     try {
    // Step 1: Clean duplicates
    await cleanDuplicateSlots();
    
    // Step 2: Create indexes
    await createSlotIndexes();
    
    // Step 3: Generate fresh slots
    await generateSlotsForWeek();
    
    console.log('✅ Migration completed successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
  }
};

});
const Slot = mongoose.model("Slot", slotSchema);
export default Slot;*/}

const slotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true,
    validate: {
      validator: function(v) {
        return v.getUTCHours() === 0 && v.getUTCMinutes() === 0 && v.getUTCSeconds() === 0;
      },
      message: 'Date must be at UTC midnight'
    }
  },
  startHour: { type: Number, required: true, min: 0, max: 23 },
  endHour: { type: Number, required: true, min: 1, max: 24 },
  duration: { type: Number, enum: [1, 3, 6, 12], required: true },
  booked: { type: Boolean, default: false, index: true },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  postId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Post",
    required: false,
    default: null,
    index: { sparse: true }
  },
   type: {
    type: String,
    enum: ['1-hour', '3-hour', '6-hour', '12-hour'],
    required: true,
  },
  bookedAt: Date,
  stickyUntil: Date,  
}, { 
  timestamps: true,
  minimize: false
});
slotSchema.set('validateBeforeSave', true);
slotSchema.set('strict', 'throw');
// Pre-save hook
slotSchema.pre('save', async function(next) {
  // Skip if this is an update to an existing document
   if (!this.date) {
    return next(new Error('Date is required for all slots'));
  }

  const existingSlot = await this.constructor.findOne({
    date: this.date,
    startHour: this.startHour,
    endHour: this.endHour
  });

  if (existingSlot) {
    // If the existing slot is booked, throw error
    if (existingSlot.booked) {
      return next(new Error(`Slot ${this.startHour}-${this.endHour} on ${this.date} already exists and is booked`));
    }
    // If not booked, we can update it
    this._id = existingSlot._id;
    this.isNew = false;
  }
  next();
});
slotSchema.pre('insertMany', function(next, docs) {
  for (const doc of docs) {
    if (!doc.date) {
      return next(new Error('All slots must have a date'));
    }
  }
  next();
});
slotSchema.pre('validate', function(next) {
  if (!this.date) {
    return next(new Error('Date is mandatory for all slot documents'));
  }
  next();
});

slotSchema.pre('save', function(next) {
  if (!this.date) return next(new Error('Slot must have a valid date'));
  next();
});

// Static methods
slotSchema.statics.cleanDuplicateSlots = async function() {
  try {
    // Find all duplicate slots
    const duplicates = await this.aggregate([
      {
        $group: {
          _id: {
            date: "$date",
            startHour: "$startHour",
            endHour: "$endHour"
          },
          ids: { $push: "$_id" },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    // Keep the first document and delete others
    for (const group of duplicates) {
      const idsToDelete = group.ids.slice(1);
      await this.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`Deleted ${idsToDelete.length} duplicates for ${group._id.date} ${group._id.startHour}-${group._id.endHour}`);
    }

    return { success: true, duplicatesFixed: duplicates.length };
  } catch (error) {
    console.error('Error cleaning duplicates:', error);
    throw error;
  }
};

slotSchema.statics.createSlotIndexes = async function() {
  try {
    // First check if index exists
    const indexes = await this.collection.indexes();
    const indexExists = indexes.some(index => 
      index.key.date && index.key.startHour && index.key.endHour && index.unique
    );

    if (!indexExists) {
      // Create the index with background: true to minimize impact
      await this.collection.createIndex(
        { date: 1, startHour: 1, endHour: 1 },
        { 
          unique: true,
          background: true,
          name: 'unique_slot_times'
        }
      );
      console.log('✅ Created unique index on slot times');
    } else {
      console.log('ℹ️ Unique index already exists');
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
};

// Add to your Slot model
slotSchema.statics.archiveOldSlots = async function(daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  // Move old slots to archive collection
  await this.aggregate([
    {
      $match: {
        date: { $lt: cutoffDate },
        booked: true
      }
    },
    {
      $merge: {
        into: "slotarchives",
        whenMatched: "keepExisting",
        whenNotMatched: "insert"
      }
    }
  ]);

  // Remove archived slots
  await this.deleteMany({
    date: { $lt: cutoffDate },
    booked: true
  });
};

slotSchema.statics.safeMigration = async function() {
  try {
    // Step 1: Clean duplicates
    await this.cleanDuplicateSlots();
    
    // Step 2: Create indexes
    await this.createSlotIndexes();
    
   
    
    console.log('✅ Migration completed successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Indexes
slotSchema.index({ date: 1, startHour: 1, endHour: 1 }, { unique: true });
slotSchema.index({ date: 1, startHour: 1, duration: 1 });
slotSchema.index({ bookedBy: 1, booked: 1 });
slotSchema.index({ stickyUntil: 1 }, { expireAfterSeconds: 0 });

const Slot = mongoose.model("Slot", slotSchema);
export default Slot;