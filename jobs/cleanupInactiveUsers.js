
import cron from "node-cron"
import User from "../Model/userModel.js";
import Post from "../Model/postModel.js";
import Slot from "../Model/slotModel.js";

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


export const unpinExpiredPosts=  async () => { // Runs every 30 minutes
  try {
      const now = new Date();

      // Find all expired pinned posts
      const expiredPosts = await Post.find({ pinned: true, pinnedUntil: { $lte: now } });

      for (let post of expiredPosts) {
          post.pinned = false;
          post.pinnedUntil = null;
          post.pinDuration = null;
          await post.save();

          // Free the booked slot
          await Slot.findOneAndUpdate({ bookedBy: post._id }, { booked: false, bookedBy: null, bookedAt: null });
      }

      console.log(`✅ Unpinned ${expiredPosts.length} expired posts.`);
  } catch (error) {
      console.error("❌ Error unpinning expired posts:", error);
  }
}

cron.schedule("*/30 * * * *",unpinExpiredPosts)