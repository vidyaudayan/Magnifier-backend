
import cron from "node-cron"


export const cleanupInactiveUsers = async () => {
  const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

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
