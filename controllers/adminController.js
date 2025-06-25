import Post from "../Model/postModel.js";
import Admin from "../Model/adminModel.js";
import Slot from "../Model/slotModel.js";
import User from "../Model/userModel.js";
import SlotReservation from "../Model/slotReservationModel.js";
import bcrypt from "bcrypt";
import moment from "moment-timezone";
import { io } from "../index.js";
import { sendSMS } from "../utils/sendSMS.js";
import mongoose from "mongoose";
import translate from "@vitalets/google-translate-api";
import { sendNotificationEmail } from "../config/notifications.js";
import { adminToken } from "../utils/generateToken.js";
import getPostLiveEmailTemplate from "../templates/approvePostMesssage.js";
import getPostRejectionEmailTemplate from "../templates/rejecttedPostMessage.js";

const convertToUTC = (hour, timezone) => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return moment.tz(date, timezone).utc().toDate();
};

// Admin signup
export const adminSingup = async (req, res) => {
  try {
    console.log(req.body);

    const { email, password, name } = req.body;
    const adminExist = await Admin.findOne({ email });
    if (adminExist) {
      return res.send("Admin is already exist");
    }

    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(password, saltRounds);

    const newAdmin = new Admin({
      name,
      email,
      hashPassword,
      role: "admin",
    });
    const newAdminrCreated = await newAdmin.save();

    if (!newAdminrCreated) {
      return res.send("Admin is not created");
    }

    const token = adminToken(newAdminrCreated);
    res.cookie("token", token);
    res.json({ message: "Admin signed in!", token });
  } catch (error) {
    console.log(error, "Something wrong");
  }
};

// Admin signin
export const adminSingin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).send("Admin is not found");
    }

    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(password, saltRounds);
    const matchPassword = await bcrypt.compare(password, hashPassword);

    console.log(matchPassword, "matchpassword");
    if (!matchPassword) {
      return res.send("password is not match");
    }

    const token = adminToken(admin);
    res.cookie("token", token, {
      secure: true,
      sameSite: "None",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      message: "Login successfully",
      data: token,
      success: true,
      admin: { id: admin._id, firstName: admin.firstName, email: admin.email },
      error: false,
    });
  } catch (error) {
    console.error("Error", error);
    res.status(500).send("Internal Server Error");
  }
};

// Fetch pending posts
export const fetchPendingPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: "pending" }).populate(
      "userId",
      'name username profilePic email'
    );
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Approve a post
export const approvePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { status: "approved",postStatus: "published" },
      { new: true }
    );

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reject a post
export const RejectPost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// update post status

{
  /*export const updatePostStatus = async (req, res) => {
    const { postId, status,stickyDuration  } = req.body; // status: 'approved' or 'rejected'

    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    try {
      const updateFields = { status };
    // If post is approved and admin chooses a sticky duration, update stickyUntil:
    if (status === "approved" && stickyDuration) {
      //updateFields.stickyUntil = new Date(Date.now() + parseInt(stickyDuration));
      updateFields.stickyUntil = new Date(Date.now() + parseInt(stickyDuration) * 60 * 60 * 1000);
      updateFields.stickyDuration = parseInt(stickyDuration);
   
    }
        const updatedPost = await Post.findByIdAndUpdate(
            postId, updateFields,
            { new: true }
        ).populate('userId', 'username email phoneNumber');

        if (!updatedPost) {
            return res.status(404).json({ message: "Post not found" });
        }
        
        if (!updatedPost.userId) {
          console.error("Error: User not found for this post.");
          return res.status(404).json({ message: "User not found for this post" });
        }   

       

            try {
              if (updatedPost.userId.email) {
                const userName = updatedPost.userId.username;
                const userEmail = updatedPost.userId.email;
            
                if (status === "approved") {
                  await sendNotificationEmail(
                    userEmail,
                    "Your Post is Live – Let the World Hear Your Voice! 🌍✨",
                    null,
                    getPostLiveEmailTemplate(userName)
                  );
                } else if (status === "rejected") {
                  await sendNotificationEmail(
                    userEmail,
                    "Let’s Refine Your Post – You’re Almost There! 🚀",
                    null,
                    getPostRejectionEmailTemplate(userName)
                  );
                }
                console.log("Email sent successfully to:", userEmail);
              }
            } catch (emailError) {
              console.error("Error sending email:", emailError);
            }
            



 // SMS Notification
 // Correcting phone number reference
if (updatedPost.userId && updatedPost.userId.phoneNumber) {
  let message = "";
  if (status === "approved") {
      message = `Great news!! Your post "${updatedPost._id}" has been approved. Your post is now live on Magnifier and ready to inspire, engage, and spark conversations!`;
  } else {
      message = `Unfortunately, your post "${updatedPost._id}" was rejected. Thank you for sharing your thoughts on Magnifier.`;
  }

  await sendSMS(updatedPost.userId.phoneNumber, message);
}


        res.status(200).json({ message: `Post ${status}`, success: true });
    } catch (error) {
        console.error("Error updating post status:", error);
        res.status(500).json({ message: "Error updating post status", error });
    }
};*/
}

{/*export const updatePostStatus = async (req, res) => {
  const { postId, status, stickyDuration } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const updateFields = { status };
    let slot;
    if (status === "approved" && stickyDuration) {
      // Find the associated slot
      const slot = await Slot.findOne({ postId });

      if (!slot) {
        return res
          .status(400)
          .json({ message: "No booking slot found for this post" });
      }

      if (status === "approved" && slot) {
        message = `... ${slot.startHour} ...`;
      }

      // Get the post to access user's timezone
      const post = await Post.findById(postId);
      const timezone = post.timezone || "Asia/Calcutta"; // Default to UTC if not specified

      {
        /*const now = new Date();
            const userNow = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
            
            // Calculate the next occurrence of the booked slot time
            const scheduledDate = new Date(userNow);
            scheduledDate.setHours(slot.startHour, 0, 0, 0);
            
            // If the time has already passed today, schedule for tomorrow
            if (scheduledDate < userNow) {
                scheduledDate.setDate(scheduledDate.getDate() + 1);
            }

            // Calculate end time
            const endDate = new Date(scheduledDate);
            endDate.setHours(slot.startHour + parseInt(stickyDuration), 0, 0, 0);



            // Calculate UTC times based on booked slot
            //const startUTC = convertToUTC(slot.startHour, timezone);
            //const endUTC = new Date(startUTC.getTime() + parseInt(stickyDuration) * 60 * 60 * 1000);
            const startUTC = new Date(scheduledDate.toISOString());
            const endUTC = new Date(endDate.toISOString());
      }

      // Get current time in timezone
      const now = new Date();
      const nowInTz = moment().tz(timezone);
      let scheduledStart = moment
        .tz(timezone)
        .hour(startHour)
        .minute(0)
        .second(0)
        .millisecond(0);

      // If time already passed today, schedule for tomorrow
      if (scheduledStart.isBefore(todayInTz)) {
        scheduledStart = scheduledStart.add(1, "day");
      }

      const scheduledEnd = scheduledStart.clone().add(duration, "hours");

      {
 ///const endUTC = endDate.utc().toDate();
            // Update fields for timezone-aware pinning
            updateFields.stickyUntil = endUTC;
            updateFields.stickyDuration = parseInt(stickyDuration);
            updateFields.stickyStartUTC = startUTC;
            updateFields.stickyEndUTC = endUTC;
            updateFields.sticky = true; // Will be set to true when start time arrives
            updateFields.timezone = timezone;

            await schedulePinOperations(postId, startUTC, endUTC);

            // Schedule the pinning/unpinning
            schedulePinOperations(postId, startUTC, endUTC);
            await Slot.findByIdAndUpdate(slot._id, {
              scheduledStartUTC: startUTC,
              scheduledEndUTC: endUTC
          });
      }
    }

    const updatedPost = await Post.findByIdAndUpdate(postId, updateFields, {
      new: true,
    }).populate("userId", "username email phoneNumber");

    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!updatedPost.userId) {
      console.error("Error: User not found for this post.");
      return res.status(404).json({ message: "User not found for this post" });
    }

    // Email Notification
    try {
      if (updatedPost.userId.email) {
        const userName = updatedPost.userId.username;
        const userEmail = updatedPost.userId.email;

        if (status === "approved") {
          await sendNotificationEmail(
            userEmail,
            "Your Post is Live – Let the World Hear Your Voice! 🌍✨",
            null,
            getPostLiveEmailTemplate(userName)
          );
        } else if (status === "rejected") {
          await sendNotificationEmail(
            userEmail,
            "Let's Refine Your Post – You're Almost There! 🚀",
            null,
            getPostRejectionEmailTemplate(userName)
          );
        }
        console.log("Email sent successfully to:", userEmail);
      }
    } catch (emailError) {
      console.error("Error sending email:", emailError);
    }

    // SMS Notification
    if (updatedPost.userId && updatedPost.userId.phoneNumber) {
      let message = "";
      if (status === "approved" && slot) {
        message = `Great news!! Your post "${
          updatedPost._id
        }" has been approved. It will be pinned from ${slot.startHour}:00 to ${
          slot.startHour + updatedPost.stickyDuration
        }:00 in your timezone.`;
      } else {
        message = `Unfortunately, your post "${updatedPost._id}" was rejected. Thank you for sharing your thoughts on Magnifier.`;
      }
      await sendSMS(updatedPost.userId.phoneNumber, message);
    }

    res.status(200).json({ message: `Post ${status}`, success: true });
  } catch (error) {
    console.error("Error updating post status:", error);
    res.status(500).json({ message: "Error updating post status", error });
  }
};*/}

// new 



export const updatePostStatus = async (req, res) => {
  const { postId, status, stickyDuration } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const updateFields = { status };
    let slot;
    
    if (status === "approved" && stickyDuration) {
      // Find the associated slot
      slot = await Slot.findOne({ postId });

      if (!slot) {
        return res.status(400).json({ message: "No booking slot found for this post" });
      }

      // Get the post to access user's timezone
      const post = await Post.findById(postId);
      const timezone = post.timezone || "Asia/Calcutta"; // Default to Kolkata time

      // Get current time in user's timezone
      const nowInTz = moment().tz(timezone);
      
      // Calculate the next occurrence of the booked slot time
      let scheduledStart = moment.tz(timezone)
        .hour(slot.startHour)
        .minute(0)
        .second(0)
        .millisecond(0);

      // If time has already passed today, schedule for tomorrow
      if (scheduledStart.isBefore(nowInTz)) {
        scheduledStart = scheduledStart.add(1, 'day');
      }

      // Calculate end time
      const scheduledEnd = scheduledStart.clone().add(stickyDuration, 'hours');

      // Convert to UTC for storage
      const startUTC = scheduledStart.utc().toDate();
      const endUTC = scheduledEnd.utc().toDate();

      // Update fields for timezone-aware pinning
      updateFields.stickyUntil = endUTC;
      updateFields.stickyDuration = parseInt(stickyDuration);
      updateFields.stickyStartUTC = startUTC;
      updateFields.stickyEndUTC = endUTC;
      updateFields.sticky = false; // Will be set to true by scheduler
      updateFields.timezone = timezone;
      updateFields.postStatus = 'scheduled';

      // Update slot with scheduled times
      await Slot.findByIdAndUpdate(slot._id, {
        scheduledStartUTC: startUTC,
        scheduledEndUTC: endUTC,
        status: 'confirmed',actualDuration: stickyDuration
      });

      // Schedule the pinning/unpinning
     await schedulePinOperations(postId, startUTC, endUTC);

      // Prepare notification message with local times
      if (status === "approved" && slot) {
        const startLocal = scheduledStart.format('h:mm A');
        const endLocal = scheduledEnd.format('h:mm A');
        message = `Great news!! Your post "${updatedPost._id}" has been approved. It will be pinned from ${startLocal} to ${endLocal} in your timezone.`;
      }

      
    } else if (status === "approved") {
      // 🟢 Normal post approval logic
      updateFields.postStatus = 'published';
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId, 
      updateFields,
      { new: true }
    ).populate('userId', 'username email phoneNumber');

    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!updatedPost.userId) {
      console.error("Error: User not found for this post.");
      return res.status(404).json({ message: "User not found for this post" });
    }

    // Email Notification
    try {
      if (updatedPost.userId.email) {
        const userName = updatedPost.userId.username;
        const userEmail = updatedPost.userId.email;
        
        const emailTemplate = status === "approved" 
          ? getPostLiveEmailTemplate(userName)
          : getPostRejectionEmailTemplate(userName);
          
        await sendNotificationEmail(
          userEmail,
          status === "approved" 
            ? "Your Post is Live – Let the World Hear Your Voice! 🌍✨" 
            : "Let's Refine Your Post – You're Almost There! 🚀",
          null,
          emailTemplate
        );
        console.log("Email sent successfully to:", userEmail);
      }
    } catch (emailError) {
      console.error("Error sending email:", emailError);
    }

    // SMS Notification
    if (updatedPost.userId?.phoneNumber) {
      let message = status === "approved" && slot
        ? `Great news!! Your post "${updatedPost._id}" has been approved. It will be pinned from ${slot.startHour}:00 to ${slot.startHour + updatedPost.stickyDuration}:00 in your timezone.`
        : `Unfortunately, your post "${updatedPost._id}" was rejected. Thank you for sharing your thoughts on Magnifier.`;
      
      await sendSMS(updatedPost.userId.phoneNumber, message);
    }

    res.status(200).json({ message: `Post ${status}`, success: true });
  } catch (error) {
    console.error("Error updating post status:", error);
    res.status(500).json({ message: "Error updating post status", error });
  }
};

// Scheduling functions
{
  /*const pinOperations = {};

const schedulePinOperations = (postId, startUTC, endUTC) => {
    const now = new Date();
    
    // Clear existing timers if any
    if (pinOperations[postId]) {
        clearTimeout(pinOperations[postId].pinTimer);
        clearTimeout(pinOperations[postId].unpinTimer);
    }

    // Schedule pinning
    if (startUTC > now) {
        const pinDelay = startUTC - now;
        pinOperations[postId] = {
            pinTimer: setTimeout(() => pinPosts(postId), pinDelay)
        };
    } else {
        pinPosts(postId);
    }

    // Schedule unpinning
    const unpinDelay = endUTC - now;
    pinOperations[postId] = {
        ...pinOperations[postId],
        unpinTimer: setTimeout(() => unpinPost(postId), unpinDelay)
    };
};

const pinPosts = async (postId) => {
    await Post.findByIdAndUpdate(postId, { sticky: true });
    io.emit('postPinned', { postId });
};

const unpinPost = async (postId) => {
    await Post.findByIdAndUpdate(postId, { sticky: false });
    io.emit('postUnpinned', { postId });
};*/
}
const activeTimers = new Map();

{/*const schedulePinOperations = async (postId, startUTC, endUTC) => {
  const now = new Date();

  // Clear existing timers
  clearTimersForPost(postId);

  // Debug current timing
  console.log(`Scheduling post ${postId}:`, {
    currentTime: now,
    pinStart: startUTC,
    pinEnd: endUTC,
    pinDelayMs: startUTC - now,
    unpinDelayMs: endUTC - now
  });

  // Schedule pinning if in future
  if (startUTC > now) {
    const pinTimer = setTimeout(async () => {
      try {
        await Post.findByIdAndUpdate(postId, { sticky: true });
        console.log(`Pinned post ${postId} at ${new Date()}`);
        io.emit('postPinned', { postId });
      } catch (error) {
        console.error(`Error pinning post ${postId}:`, error);
      }
      activeTimers.delete(`${postId}_pin`);
    }, startUTC - now);

    activeTimers.set(`${postId}_pin`, pinTimer);
  } 
  // If already within window, pin immediately but log warning
  else if (now < endUTC) {
    console.warn(`Post ${postId} is being pinned immediately (within scheduled window)`);
    await Post.findByIdAndUpdate(postId, { sticky: true });
  }

  // Schedule unpinning
  const unpinTimer = setTimeout(async () => {
    try {
      await Post.findByIdAndUpdate(postId, { sticky: false });
      console.log(`Unpinned post ${postId} at ${new Date()}`);
      io.emit('postUnpinned', { postId });
    } catch (error) {
      console.error(`Error unpinning post ${postId}:`, error);
    }
    activeTimers.delete(`${postId}_unpin`);
  }, endUTC - now);

  activeTimers.set(`${postId}_unpin`, unpinTimer);
};

const clearTimersForPost = (postId) => {
  const pinTimer = activeTimers.get(`${postId}_pin`);
  const unpinTimer = activeTimers.get(`${postId}_unpin`);

  if (pinTimer) clearTimeout(pinTimer);
  if (unpinTimer) clearTimeout(unpinTimer);

  activeTimers.delete(`${postId}_pin`);
  activeTimers.delete(`${postId}_unpin`);
};*/}

const schedulePinOperations = async (postId, startUTC, endUTC) => {
  const now = new Date();
  clearTimersForPost(postId);

  // Debug logging
  console.log(`Scheduling post ${postId}:`, {
    currentTime: now,
    scheduledStart: startUTC,
    scheduledEnd: endUTC,
    timeUntilStart: startUTC - now,
    duration: endUTC - startUTC
  });

  // Schedule pinning if in future
  if (startUTC > now) {
    const pinTimer = setTimeout(async () => {
      try {
        await Post.findByIdAndUpdate(postId, { 
          sticky: true,
          postStatus: 'published' // Only set to published when it's time
        });
        console.log(`Pinned post ${postId} at ${new Date()}`);
        io.emit('postPinned', { postId });
      } catch (error) {
        console.error(`Error pinning post ${postId}:`, error);
      }
      activeTimers.delete(`${postId}_pin`);
    }, startUTC - now);

    activeTimers.set(`${postId}_pin`, pinTimer);
  } 
  
  else if (now < endUTC) {
    console.warn(`Post ${postId} is already within scheduled window, but will be pinned via timer to ensure proper visibility.`);
    
    const delay = 1000; // 1 second or any minimal delay
    const pinTimer = setTimeout(async () => {
      try {
        await Post.findByIdAndUpdate(postId, { 
          sticky: true,
          postStatus: 'published'
        });
        console.log(`Pinned post ${postId} (delayed start) at ${new Date()}`);
        io.emit('postPinned', { postId });
      } catch (error) {
        console.error(`Error pinning post ${postId}:`, error);
      }
      activeTimers.delete(`${postId}_pin`);
    }, delay);
  
    activeTimers.set(`${postId}_pin`, pinTimer);
  }
  
  // If already within window, pin immediately but log warning
  {/*else if (now < endUTC) {
    console.warn(`Post ${postId} is being pinned immediately (within scheduled window)`);
    await Post.findByIdAndUpdate(postId, { 
      sticky: true,
      postStatus: 'published'
    });*/}
  
  

  // Schedule unpinning
  const unpinTimer = setTimeout(async () => {
    try {
      await Post.findByIdAndUpdate(postId, { 
        sticky: false,
        postStatus: 'expired' // Mark as expired after time slot
      });
      console.log(`Unpinned post ${postId} at ${new Date()}`);
      io.emit('postUnpinned', { postId });
    } catch (error) {
      console.error(`Error unpinning post ${postId}:`, error);
    }
    activeTimers.delete(`${postId}_unpin`);
  }, endUTC - now);

  activeTimers.set(`${postId}_unpin`, unpinTimer);
};


// Log out
export const logout = async (req, res) => {
  res
    .status(200)
    .json({ success: true, message: "User logged out successfully." });
};

// Get avilable slots



{/*export const getAvailableSlots = async (req, res) => {
  try {
    const { duration } = req.query;
    const now = new Date();

    // Only show slots that are either:
    // 1. Not booked at all, OR
    // 2. Booked but expired (either reservation expired or pinning period ended)
    const slots = await Slot.find({
      duration: parseInt(duration),
      $or: [
        {
          booked: false,
          $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $lt: now } }],
        },
        {
          booked: true,
          $and: [{ expiresAt: { $lt: now } }, { pinnedUntil: { $lt: now } }],
        },
      ],
    }).sort({ startHour: 1 });

    res.json(slots);
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ error: "Error fetching slots" });
  }
};*/}

{/*export const getAvailableSlots = async (req, res) => {
  try {
    const { duration, date } = req.query;
    const now = new Date();
    
    // Default to today if no date provided
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);
    
    // Simplified query
    {/*const slots = await Slot.find({
      date: queryDate,
      duration: parseInt(duration),
      booked: false,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $lt: now } }
      ]
    }).sort({ startHour: 1 });*/}
    {/*const slots = await Slot.find({
      date: queryDate,
      duration: parseInt(duration),
      $or: [
        { booked: false },
        { 
          booked: true,
          expiresAt: { $lt: now } // Show if booking expired
        }
      ]
    }).sort({ startHour: 1 });

    res.json(slots);
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ error: "Error fetching slots" });
  }
};*/}

// new 13

async function isSlotAvailable(date, startHour, duration) {
  const endHour = startHour + duration;
  const now = new Date();

  const overlappingSlot = await Slot.findOne({
    date: new Date(date),
    booked: true,
    $or: [
      {
        startHour: { $lt: endHour },
        endHour: { $gt: startHour }
      }
    ],
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: now } },
      { stickyUntil: { $gt: now } }
    ]
  });

  return !overlappingSlot;
}



// Format time function

   

// In your slots controller



{/*export const getAvailableSlots = async (req, res) => {
  try {
    const { date, duration } = req.query;
    const queryDate = new Date(date);
    queryDate.setUTCHours(0, 0, 0, 0);

    // Get current time in UTC
    const now = new Date();
    const currentUTCHour = now.getUTCHours();
    const isToday = now.toISOString().split('T')[0] === date;

    // Get all slots for the day with the exact duration
    const allSlots = await Slot.find({ 
      date: queryDate,
      duration: parseInt(duration)
    }).lean();

    // Filter available slots
    const availableSlots = allSlots.filter(slot => {
      // Slot is not booked OR is booked by current user (for modification)
      const isAvailable = !slot.booked || 
                         (req.user && slot.bookedBy && slot.bookedBy.toString() === req.user.id.toString());
      
      // Filter out past slots if it's today
      if (isToday && slot.startHour < currentUTCHour) {
        return false;
      }
      
      return isAvailable;
    });

    res.json(availableSlots.map(slot => ({
      ...slot,
      displayTime: formatSlotTime(slot.startHour, slot.endHour),
      isAvailable: !slot.booked
    })));
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
};*/}
// new

export const getAvailableSlots = async (req, res) => {
  try {
    const { date, duration } = req.query;
    const queryDate = new Date(date);
    queryDate.setUTCHours(0, 0, 0, 0);

    // Get current time in UTC
    const now = new Date();
    const currentUTCHour = now.getUTCHours();
    const isToday = now.toISOString().split('T')[0] === date;

    // Get all slots for the day with the exact duration
    const allSlots = await Slot.find({ 
      date: queryDate,
      duration: parseInt(duration)
    }).lean();

    // Get all booked slots to check for overlaps
    const bookedSlots = await Slot.find({
      date: queryDate,
      booked: true
    }).lean();

    // Filter available slots
    const availableSlots = allSlots.filter(slot => {
      // Slot is not booked OR is booked by current user (for modification)
      const isAvailable = !slot.booked || 
                       (req.user && slot.bookedBy && slot.bookedBy.toString() === req.user.id.toString());
      
      // Filter out past slots if it's today
      if (isToday && slot.startHour < currentUTCHour) {
        return false;
      }

      // Check if this slot overlaps with any booked slots
      const isOverlapping = bookedSlots.some(bookedSlot => {
        return (
          bookedSlot.startHour <= slot.startHour && 
          bookedSlot.endHour >= slot.endHour
        );
      });

      return isAvailable && !isOverlapping;
    });

    res.json(availableSlots.map(slot => ({
      ...slot,
      displayTime: formatSlotTime(slot.startHour, slot.endHour),
      isAvailable: !slot.booked
    })));
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
};

function formatSlotTime(startHour, endHour) {
  const startPeriod = startHour >= 12 ? 'PM' : 'AM';
  const endPeriod = endHour >= 12 ? 'PM' : 'AM';
  const displayStart = startHour % 12 || 12;
  const displayEnd = endHour % 12 || 12;
  
  return `${displayStart}:00 ${startPeriod} - ${displayEnd}:00 ${endPeriod}`;
}
// check avialbility
{/*export const checkAvailability= async (req, res) => {
  try {
    const { date, startHour, duration } = req.query;
    const available = await isSlotAvailable(new Date(date), startHour, duration);
    res.json({ available });
  } catch (error) {
    res.status(500).json({ error: "Availability check failed" });
  }
}*/}

// new 

export const checkAvailability = async (req, res) => {
  try {
    const { date, startHour, duration } = req.query;
    const queryDate = new Date(date);
    queryDate.setUTCHours(0, 0, 0, 0);
    const endHour = parseInt(startHour) + parseInt(duration);

    // Check if the exact slot is available
    const exactSlot = await Slot.findOne({
      date: queryDate,
      startHour: parseInt(startHour),
      duration: parseInt(duration),
      booked: false
    });

    if (!exactSlot) {
      return res.json({ available: false });
    }

    // Check if any overlapping longer slots are booked
    const overlappingBooked = await Slot.findOne({
      date: queryDate,
      startHour: { $lte: parseInt(startHour) },
      endHour: { $gte: endHour },
      booked: true
    });

    res.json({ available: !overlappingBooked });
  } catch (error) {
    res.status(500).json({ error: "Availability check failed" });
  }
}

// pin post new

export const pinPost = async (req, res) => {
  try {
    const { postId, slotHour } = req.body;

    // Get the reservation to find the duration
    const reservation = await SlotReservation.findOne({
      startHour: slotHour,
      status: "confirmed",
    }).sort({ createdAt: -1 });

    if (!reservation) {
      return res.status(404).json({ error: "No reservation found" });
    }

    const now = new Date();
    const startTime = new Date(now);
    startTime.setHours(slotHour, 0, 0, 0);

    const expirationTime = new Date(startTime);
    expirationTime.setHours(expirationTime.getHours() + reservation.duration);

    const post = await Post.findByIdAndUpdate(postId, {
      sticky: true, // Activate immediately
      stickyUntil: expirationTime,
      stickyDuration: reservation.duration,
    });

    res.json({
      message: `Post pinned for ${reservation.duration} hours.`,
      stickyUntil: expirationTime,
    });
  } catch (error) {
    res.status(500).json({ error: "Error pinning post" });
  }
};


 
   

{/*export const bookSlot = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { startHour, duration, postId, selectedDate } = req.body;
      const userId = req.user.id;
      const endHour = startHour + duration;
      
      const bookingDate = new Date(selectedDate);
      bookingDate.setUTCHours(0, 0, 0, 0);

      // 1. Check if user already has an active pinned post
      const existingPinnedPost = await Slot.findOne({
        bookedBy: userId,
        booked: true,
        stickyUntil: { $gt: new Date() }
      }).session(session);

      if (existingPinnedPost) {
        throw {
          status: 400,
          message: "You already have an active pinned post",
          details: `You can only have one pinned post at a time (currently pinned until ${existingPinnedPost.stickyUntil})`
        };
      }

      // 2. Check for any overlapping booked slots
      const overlappingBooked = await Slot.findOne({
        date: bookingDate,
        booked: true,
        $or: [
          { startHour: { $lt: endHour }, endHour: { $gt: startHour } }
        ]
      }).session(session);

      if (overlappingBooked) {
        throw { 
          status: 409,
          message: "Slot overlaps with existing booking",
          details: `Cannot book from ${startHour}:00 to ${endHour}:00 because it overlaps with an existing booking`
        };
      }

      // 3. Find and book the exact slot
      const bookedSlot = await Slot.findOneAndUpdate(
        {
          date: bookingDate,
          startHour: parseInt(startHour),
          duration: parseInt(duration),
          booked: false
        },
        {
          $set: {
            booked: true,
            bookedBy: userId,
            postId,
            bookedAt: new Date(),
            stickyUntil: new Date(
              Date.UTC(
                bookingDate.getUTCFullYear(),
                bookingDate.getUTCMonth(),
                bookingDate.getUTCDate(),
                endHour, 0, 0, 0
              )
            )
          }
        },
        { new: true, session }
      );

      if (!bookedSlot) {
        throw { 
          status: 409,
          message: "Slot not available",
          details: `No available ${duration}-hour slot found for ${bookingDate.toISOString().split('T')[0]} at ${startHour}:00`
        };
      }

      // 4. Update the post
      const stickyStartUTC = new Date(
        Date.UTC(
          bookingDate.getUTCFullYear(),
          bookingDate.getUTCMonth(),
          bookingDate.getUTCDate(),
          startHour, 0, 0, 0
        )
      );
      
      const stickyEndUTC = new Date(
        Date.UTC(
          bookingDate.getUTCFullYear(),
          bookingDate.getUTCMonth(),
          bookingDate.getUTCDate(),
          endHour, 0, 0, 0
        )
      );

      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        {
          $set: {
            sticky: true,
            stickyStartUTC,
            stickyEndUTC,
            stickyDuration: duration,
            stickyUntil: stickyEndUTC
          }
        },
        { new: true, session }
      );

      // Return response before emitting socket event
      res.json({ 
        success: true, 
        slot: bookedSlot,
        post: updatedPost 
      });

      // Emit socket event after successful response
      if (req.app.get('io')) {
        req.app.get('io').emit("slotBooked", {
          date: bookingDate,
          startHour,
          duration
        });
      }
    });
  } catch (error) {
    console.error("Booking failed:", error);
    const status = error.status || 500;
    const message = error.message || "Booking failed";
    const details = error.details || (process.env.NODE_ENV === 'development' ? error.message : undefined);
    
    res.status(status).json({ 
      error: message,
      details
    });
  } finally {
    await session.endSession();
  }
}; */}
export const bookSlots = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { startHour, duration, postId, selectedDate } = req.body;
    const userId = req.user.id;
    const endHour = startHour + duration;
    
    const bookingDate = new Date(selectedDate);
    bookingDate.setUTCHours(0, 0, 0, 0);

    // 1. Check if slot is still available (double-check)
    const existingSlot = await Slot.findOne({
      date: bookingDate,
      startHour: parseInt(startHour),
      duration: parseInt(duration)
    }).session(session);

    if (!existingSlot) {
      throw {
        status: 404,
        message: "Slot not found",
        details: `No slot found for ${bookingDate.toISOString().split('T')[0]} at ${startHour}:00`
      };
    }

    if (existingSlot.booked) {
      throw {
        status: 409,
        message: "Slot already booked",
        details: `Slot from ${startHour}:00 to ${endHour}:00 is already booked by another user`
      };
    }

    // 2. Book the slot
    const bookedSlot = await Slot.findByIdAndUpdate(
      existingSlot._id,
      {
        $set: {
          booked: true,
          bookedBy: userId,
          postId,
          bookedAt: new Date(),
          stickyUntil: new Date(
            Date.UTC(
              bookingDate.getUTCFullYear(),
              bookingDate.getUTCMonth(),
              bookingDate.getUTCDate(),
              endHour, 0, 0, 0
            )
          )
        }
      },
      { new: true, session }
    );

    // 3. Update the post
    const stickyStartUTC = new Date(
      Date.UTC(
        bookingDate.getUTCFullYear(),
        bookingDate.getUTCMonth(),
        bookingDate.getUTCDate(),
        startHour, 0, 0, 0
      )
    );
    
    const stickyEndUTC = new Date(
      Date.UTC(
        bookingDate.getUTCFullYear(),
        bookingDate.getUTCMonth(),
        bookingDate.getUTCDate(),
        endHour, 0, 0, 0
      )
    );

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $set: {
          sticky: true,
          stickyStartUTC,
          stickyEndUTC,
          stickyDuration: duration,
          stickyUntil: stickyEndUTC
        }
      },
      { new: true, session }
    );

    await session.commitTransaction();

    // Emit socket event after successful booking
    if (req.app.get('io')) {
      req.app.get('io').emit("slotBooked", {
        date: bookingDate,
        startHour,
        duration
      });
    }

    res.json({ 
      success: true, 
      slot: bookedSlot,
      post: updatedPost 
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Booking failed:", error);
    const status = error.status || 500;
    const message = error.message || "Booking failed";
    const details = error.details || (process.env.NODE_ENV === 'development' ? error.message : undefined);
    
    res.status(status).json({ 
      error: message,
      details
    });
  } finally {
    await session.endSession();
  }
};

export const bookSlot = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { startHour, duration, postId, selectedDate } = req.body;
    const userId = req.user.id;

     if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw {
        status: 400,
        message: "Invalid post ID format"
      };
    }

     if (!post) {
      // Check if post exists at all
      const postExists = await Post.exists({ _id: postId }).session(session);
      throw {
        status: 404,
        message: postExists 
          ? "You don't own this post" 
          : "Post not found",
        details: {
          postExists,
          userOwnsPost: false
        }
      };
    }
    const endHour = startHour + duration;
    
    const bookingDate = new Date(selectedDate);
    bookingDate.setUTCHours(0, 0, 0, 0);

    // 1. Verify the post exists and belongs to user
    const post = await Post.findOne({
      _id: postId,
      author: userId
    }).session(session);

    if (!post) {
      throw {
        status: 404,
        message: "Post not found or not owned by user"
      };
    }

    // 2. Check if slot is available (with strong consistency)
    const existingSlot = await Slot.findOneAndUpdate(
      {
        date: bookingDate,
        startHour: parseInt(startHour),
        duration: parseInt(duration),
        booked: false,
        $or: [
          { bookedBy: null },
          { bookedBy: { $exists: false } }
        ]
      },
      {
        $set: {
          booked: true,
          bookedBy: userId,
          postId,
          bookedAt: new Date(),
          stickyUntil: new Date(
            Date.UTC(
              bookingDate.getUTCFullYear(),
              bookingDate.getUTCMonth(),
              bookingDate.getUTCDate(),
              endHour, 0, 0, 0
            )
          )
        }
      },
      { new: true, session }
    );

    if (!existingSlot) {
      throw {
        status: 409,
        message: "Slot no longer available"
      };
    }

    // 3. Update the post with booking reference
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $set: {
          sticky: true,
          stickyUntil: existingSlot.stickyUntil,
          pinnedSlot: existingSlot._id
        }
      },
      { new: true, session }
    );

    // 4. Create a backup record
    const bookingRecord = new BookingHistory({
      slot: existingSlot._id,
      post: postId,
      user: userId,
      bookedAt: new Date(),
      duration,
      startHour,
      endHour,
      date: bookingDate
    });
    await bookingRecord.save({ session });

    await session.commitTransaction();

    // Emit real-time update
    req.app.get('io')?.emit("slotBooked", {
      date: bookingDate,
      startHour,
      duration
    });

    res.json({ 
      success: true, 
      slot: existingSlot,
      post: updatedPost 
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Booking failed:", {
      message: error.message,
      status: error.status,
      details: error.details,
      userId: req.user?.id,
      postId: req.body?.postId
    });

    console.error("Booking failed:", error);
    const status = error.status || 500;
    res.status(status).json({ 
      error: error.message || "Booking failed",
      details: error.details
    });
  } finally {
    await session.endSession();
  }
};

// recover booking 

export const recoverBookings= async (req, res) => {
  try {
    // Find bookings where slot is missing but history exists
    const orphanedBookings = await BookingHistory.aggregate([
      {
        $lookup: {
          from: 'slots',
          localField: 'slot',
          foreignField: '_id',
          as: 'slotData'
        }
      },
      {
        $match: {
          slotData: { $size: 0 },
          cancelled: { $ne: true }
        }
      }
    ]);

    const recovered = [];
    
    for (const booking of orphanedBookings) {
      // Recreate the slot
      const newSlot = await Slot.create({
        date: booking.date,
        startHour: booking.startHour,
        endHour: booking.endHour,
        duration: booking.duration,
        type: `${booking.duration}-hour`,
        booked: true,
        bookedBy: booking.user,
        postId: booking.post,
        bookedAt: booking.bookedAt,
        stickyUntil: new Date(
          Date.UTC(
            booking.date.getUTCFullYear(),
            booking.date.getUTCMonth(),
            booking.date.getUTCDate(),
            booking.endHour, 0, 0, 0
          )
        )
      });

      // Update history record
      await BookingHistory.findByIdAndUpdate(booking._id, {
        $set: { slot: newSlot._id }
      });

      recovered.push(newSlot);
    }

    res.json({
      success: true,
      recoveredCount: recovered.length,
      recoveredSlots: recovered
    });
  } catch (error) {
    res.status(500).json({
      error: "Recovery failed",
      details: error.message
    });
  }
}

// check booking

export const checkBooking=async (req, res) => {
  try {
    const { postId } = req.query;
    
    if (!postId) {
      return res.status(400).json({ error: "postId is required" });
    }

    // Validate postId format
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: "Invalid postId format" });
    }

    // Check if slot exists for this post
    const slot = await Slot.findOne({ postId }).lean();
    
    // Check if booking history exists
    const history = await BookingHistory.findOne({ post: postId }).lean();
    
    res.json({
      success: true,
      bookingMissing: !!history && !slot,
      hasHistory: !!history,
      hasSlot: !!slot,
      slot,
      history
    });
  } catch (error) {
    console.error('Booking check error:', error);
    res.status(500).json({ 
      error: "Check failed",
      details: error.message
    });
  }
}

// ownership 

export const postOwnership= async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id; // Assuming you have authentication middleware

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: "Invalid post ID format" });
    }

    const post = await Post.findOne({
      _id: postId,
      author: userId
    }).lean();

    res.json({
      success: true,
      isOwner: !!post,
      post
    });
  } catch (error) {
    console.error('Ownership verification error:', error);
    res.status(500).json({
      error: "Failed to verify post ownership",
      details: error.message
    });
  }
}

// new
// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
};

// get all posts

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name email vidhanSabha username"); // Fetch posts sorted by latest first
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// get approved posts

export const getApprovedPosts = async (req, res) => {
  try {
    // Find all posts with status 'approved' and populate user details
    const approvedPosts = await Post.find({ status: 'approved' })
      .populate({
        path: 'userId',
        select: 'name username profilePic vidhanSabha' // Only include necessary user fields
      })
      .sort({ createdAt: -1 }); // Sort by newest first

    // Map the posts to include all required fields for the admin panel
    const formattedPosts = approvedPosts.map(post => ({
      _id: post._id,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      content: post.content,
      mediaUrl: post.mediaUrl,
      postType: post.postType,
      mediaSummary: post.mediaSummary || 'No summary available', // Default if no summary
      likes: post.likes || 0,
      dislikes: post.dislikes || 0,
      comments: post.comments || [],
      shares: post.shares || 0,
      userId: post.userId || null, // Entire user object
      vidhanSabha: post.userId?.vidhanSabha || 'N/A' // Direct access to constituency
    }));

    res.status(200).json({
      success: true,
      count: formattedPosts.length,
      data: formattedPosts
    });
  } catch (error) {
    console.error('Error fetching approved posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approved posts',
      error: error.message
    });
  }
};