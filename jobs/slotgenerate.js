import Slot from "../Model/slotModel.js"; 
import cron from 'node-cron';





{/*export const generateSlotsForWeek = async () => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    
    // Clean up ALL empty slots (including past dates) that aren't booked
    await Slot.deleteMany({ 
      date: { $lt: weekEnd }, // All slots before weekEnd
      booked: false,
      $or: [
        { bookedBy: null },
        { bookedBy: { $exists: false } }
      ],
      postId: null
    });

    const durations = [1, 3, 6, 12];
    const bulkOps = [];
    const now = new Date();

    for (let day = 0; day < 7; day++) {
      const slotDate = new Date(today);
      slotDate.setDate(today.getDate() + day);
      slotDate.setUTCHours(0, 0, 0, 0);

      for (const duration of durations) {
        for (let hour = 0; hour < 24; hour += duration) {
          if (hour + duration <= 24) {
            bulkOps.push({
              updateOne: {
                filter: {
                  date: slotDate,
                  startHour: hour,
                  endHour: hour + duration,
                  duration: duration
                },
                update: {
                  $setOnInsert: {
                    date: slotDate,
                    startHour: hour,
                    endHour: hour + duration,
                    duration: duration,
                    type: `${duration}-hour`,
                    booked: false,
                    postId: null,
                    createdAt: now
                  },
                  $set: {
                    updatedAt: now
                  }
                },
                upsert: true
              }
            });
          }
        }
      }
    }

    for (const op of bulkOps) {
      try {
        await Slot.updateOne(op.updateOne.filter, op.updateOne.update, { upsert: true });
      } catch (error) {
        console.warn(`Failed to upsert slot: ${op.updateOne.filter.startHour} - ${error.message}`);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Slot generation failed:', error);
    throw error;
  }
};*/}

export const generateSlotsForWeek = async () => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    
    // Only clean up truly empty slots (never booked)
    await Slot.deleteMany({ 
      date: { $gte: today, $lt: weekEnd },
      booked: false,
      postId: null,
      bookedBy: null,
      $or: [
        { bookedAt: null },
        { bookedAt: { $exists: false } }
      ]
    });

    const durations = [1, 3, 6, 12];
    const bulkOps = [];
    const now = new Date();

    for (let day = 0; day < 7; day++) {
      const slotDate = new Date(today);
      slotDate.setDate(today.getDate() + day);
      slotDate.setUTCHours(0, 0, 0, 0);

      for (const duration of durations) {
        for (let hour = 0; hour < 24; hour += duration) {
          if (hour + duration <= 24) {
            bulkOps.push({
              updateOne: {
                filter: {
                  date: slotDate,
                  startHour: hour,
                  endHour: hour + duration,
                  duration: duration,
                  booked: false // Only upsert if not booked
                },
                update: {
                  $setOnInsert: {
                    date: slotDate,
                    startHour: hour,
                    endHour: hour + duration,
                    duration: duration,
                    type: `${duration}-hour`,
                    booked: false,
                    postId: null,
                    createdAt: now
                  },
                  $set: {
                    updatedAt: now
                  }
                },
                upsert: true
              }
            });
          }
        }
      }
    }

    if (bulkOps.length > 0) {
      await Slot.bulkWrite(bulkOps, { ordered: false });
    }

    return { success: true };
  } catch (error) {
    console.error('Slot generation failed:', error);
    throw error;
  }
};
      
// Run at midnight daily to generate new slots
cron.schedule('0 0 * * *', async () => {
  await generateSlotsForWeek();
});
   export const initializeSlotSystem = async () => {
  try {
    // First run the safe migration
    await Slot.safeMigration();
    
    // Then generate fresh slots
    await generateSlotsForWeek();
    
    console.log('Slot system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize slot system:', error);
    throw error;
  }
};

