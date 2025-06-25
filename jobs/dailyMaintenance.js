import Slot from "../Model/slotModel.js"; 
import cron from 'node-cron';
import Post from "../Model/postModel.js";
export const runDailyMaintenance = async () => {
  try {
    // 1. Archive old slots
    await Slot.archiveOldSlots(7); // Keep 7 days of slots
    
    // 2. Validate active bookings
    const now = new Date();
    const activeBookings = await Slot.find({
      booked: true,
      stickyUntil: { $gt: now }
    });
    
    for (const booking of activeBookings) {
      // Verify the post still exists
      const postExists = await Post.exists({ _id: booking.postId });
      if (!postExists) {
        await Slot.findByIdAndUpdate(booking._id, {
          $set: {
            booked: false,
            bookedBy: null,
            postId: null,
            bookedAt: null,
            stickyUntil: null
          }
        });
        
        await BookingHistory.findOneAndUpdate(
          { slot: booking._id },
          { $set: { cancelled: true, cancelledAt: now } }
        );
      }
    }
    
    // 3. Generate new slots
    await generateSlotsForWeek();
    
    console.log('Daily maintenance completed');
  } catch (error) {
    console.error('Daily maintenance failed:', error);
  }
};

// Add to your cron jobs
cron.schedule('0 3 * * *', runDailyMaintenance); // Run daily at 3 AM