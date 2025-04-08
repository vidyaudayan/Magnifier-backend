
import cron from "node-cron"
import User from "../Model/userModel.js";
import Post from "../Model/postModel.js";
import Slot from "../Model/slotModel.js";
import SlotReservation from "../Model/slotReservationModel.js";

export const cleanupInactiveUsers = async () => {
  const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;
  //const THIRTY_DAYS_IN_MS = 1 * 60 * 1000
  try {
    const now = new Date();
    const deletionThreshold = new Date(now - THIRTY_DAYS_IN_MS);

    // Find and delete users who have been inactive for over 30 days
    const result = await User.deleteMany({
      isActive: false,
      deactivatedAt: { $lte: deletionThreshold },
    });

    console.log(`${result.deletedCount} users deleted.`);
  } catch (error) {
    console.error('Error cleaning up inactive users:', error);
  }
};
 
// Schedule the cleanup job to run daily at midnight
cron.schedule('0 0 * * *', cleanupInactiveUsers);


export const unpinExpiredPosts = async () => {
  try {
      const now = new Date();

      // Find all expired pinned posts
      const expiredPosts = await Post.find({ sticky: true, stickyUntil: { $lte: now } });

      if (expiredPosts.length === 0) {
          console.log("✅ No expired posts to unpin.");
          return;
      }

      // Unpin all expired posts at once
      await Post.updateMany(
          { sticky: true, stickyUntil: { $lte: now } },
          { $set: { sticky: false, stickyUntil: null, stickyDuration: null } }
      );

      // Free the booked slots
      await Slot.updateMany(
          { bookedBy: { $in: expiredPosts.map(p => p._id) } },
          { $set: { booked: false, bookedBy: null, bookedAt: null } }
      );

      console.log(`✅ Unpinned ${expiredPosts.length} expired posts.`);
  } catch (error) {
      console.error("❌ Error unpinning expired posts:", error);
  }
};


cron.schedule("*/30 * * * *",unpinExpiredPosts)

export const resetSlotsDaily = async () => {
  try {
      await Slot.updateMany({}, { booked: false, bookedBy: null, bookedAt: null });
      console.log("✅ All slots reset for the new day!");
  } catch (error) {
      console.error("❌ Error resetting slots:", error);
  }
};
cron.schedule("0 0 * * *", resetSlotsDaily);



export const processStickyPosts = async () => {
  try {
      const now = new Date();

      // Activate posts that should become sticky now
      const pendingStickyPosts = await Post.find({ 
          sticky: false, 
          scheduledStickyTime: { $lte: now }, 
          stickyUntil: { $gt: now } 
      });

      for (let post of pendingStickyPosts) {
          post.sticky = true; // Activate sticky status
          await post.save();
          console.log(`✅ Post ${post._id} is now sticky.`);
      }

      // Unpin expired sticky posts
      const expiredPosts = await Post.find({ sticky: true, stickyUntil: { $lte: now } });

      for (let post of expiredPosts) {
          post.sticky = false;
          post.scheduledStickyTime = null;
          post.stickyUntil = null;
          post.stickyDuration = null;
          await post.save();

          console.log(`✅ Unpinned expired post ${post._id}`);
      }
  } catch (error) {
      console.error("❌ Error processing sticky posts:", error);
  }
};  

// ✅ Run every minute
cron.schedule("*/1 * * * *", processStickyPosts);


const clearExpiredReservations = async () => {
  const expirationTime = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago

  const expiredReservations = await SlotReservation.find({
    status: "pending",
    createdAt: { $lt: expirationTime },
  });

  for (const reservation of expiredReservations) {
    await reservation.deleteOne(); // Delete reservation

    // Optionally reset the Slot if needed
    await Slot.updateMany(
      { bookedBy: reservation._id },
      { booked: false, bookedBy: null, bookedAt: null }
    );
  }
};

setInterval(clearExpiredReservations, 5 * 60 * 1000); // Run every 5 minutes

//slot release 

export const releaseExpiredSlots = async () => {
  try {
    const now = new Date();
    
    // Release expired slots
    const releasedSlots = await Slot.updateMany(
      { 
        booked: true,
        pinnedUntil: { $lt: now } 
      },
      { 
        $set: { 
          booked: false,
          bookedBy: null,
          postId: null,
          expiresAt: null
        } 
      }
    );

    // Update associated posts
    await Post.updateMany(
      {
        stickyUntil: { $lt: now },
       
      },
      {
        $set: {
          sticky: false,
          postStatus: 'approved' // Or whatever status you want after pinning ends
        }
      }
    );

    console.log(`Released ${releasedSlots.nModified} expired slots`);
  } catch (error) {
    console.error('Error releasing slots:', error);
  }
};

cron.schedule('0 * * * *', async () => {
  console.log('Running slot release job...');
  await releaseExpiredSlots();
});