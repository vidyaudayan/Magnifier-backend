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

{
  /*export const getAvailableSlots = async (req, res) => {
  try {
    const { duration } = req.query;
    const now = new Date();

    const slots = await Slot.find({
      duration: parseInt(duration),
      $or: [
        { booked: false },
        { expiresAt: { $lt: now } },
        { pinnedUntil: { $lt: now } }
      ]
    }).sort({ startHour: 1 }); // Sort by start hour

    res.json(slots);
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ error: "Error fetching slots" });
  }
};*/
}

export const getAvailableSlots = async (req, res) => {
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
};

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

{
  /*
export const bookSlot = async (req, res) => {
  try {
    const { startHour, endHour,duration,postId } = req.body;
    const userId = req.user.id; // Changed from req.user.id to req.user._id
// Validate duration
if (![1, 3, 6, 12].includes(Number(duration))) {
  return res.status(400).json({
    success: false,
    error: "Invalid duration selected"
  });
}

// Validate postId exists
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid post ID"
      });
    }

    // Validation checks
    if (isNaN(startHour) || isNaN(endHour)) {
      return res.status(400).json({
        success: false,
        error: "Start and end hours must be numbers"
      });
    }

    if (startHour < 0 || startHour > 23 || endHour < 1 || endHour > 24) {
      return res.status(400).json({
        success: false,
        error: "Hours must be between 0-23 for start and 1-24 for end"
      });
    }

    if (startHour >= endHour) {
      return res.status(400).json({
        success: false,
        error: `End hour (${endHour}) must be after start hour (${startHour})`
      });
    }

    // Check availability
    const conflictingSlots = await Slot.find({
      hour: { $gte: startHour, $lt: endHour },
      booked: true,
      expiresAt: { $gt: new Date() } // Only check non-expired bookings
    });

    if (conflictingSlots.length > 0) {
      return res.status(409).json({
        success: false,
        error: `${conflictingSlots.length} slot(s) already booked`,
        conflicts: conflictingSlots.map(s => s.hour)
      });
    }

    // Book slots
    const slotsToBook = [];
    for (let hour = startHour; hour < endHour; hour++) {
      slotsToBook.push({
        updateOne: {
          filter: { hour },
          update: {
            $set: {
              booked: true,
              bookedBy: userId,
              bookedAt: new Date(),
              expiresAt: new Date(Date.now() + 15*60*1000) // 15 min expiry
            }
          },
          upsert: true // Create slot if doesn't exist
        }
      });
    }

    await Slot.bulkWrite(slotsToBook);

    // Create reservation
    const reservation = await SlotReservation.create({
      userId,
      startHour,
      endHour,duration,
      status: "confirmed"
    });

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { 
        stickyDuration: duration,
        stickyUntil: new Date(Date.now() + duration * 60 * 60 * 1000)
      },
      { new: true }
    );   

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        error: "Post not found"
      });
    }

    // Notify all clients
    io.emit("slotBooked", { startHour, endHour });

    res.status(200).json({
      success: true,
      message: "Slots booked successfully",
      reservation,post: updatedPost
    });

  } catch (error) {
    console.error("Slot booking failed:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
};*/
}

// Updated bookSlot function
{
  /*export const bookSlot = async (req, res) => {
  try {
    const { startHour, endHour, duration, postId } = req.body;
    const userId = req.user.id;
    const stickyUntil= new Date(Date.now() + duration * 60 * 60 * 1000);
    const bookingGroupId = new mongoose.Types.ObjectId()
    // Validate inputs
    if (![1, 3, 6, 12].includes(Number(duration))) {
      return res.status(400).json({ error: "Invalid duration" });
    }

    // Check if slot is already booked
    const existingBooking = await Slot.findOne({
      startHour,
      endHour,
      booked: true,
      expiresAt: { $gt: new Date() }
    });

    if (existingBooking) {
      return res.status(409).json({ 
        error: "Slot already booked",
        conflict: existingBooking 
      });
    }

    // Book the slot
    const bookedSlot = await Slot.findOneAndUpdate(
      { 
        startHour,
        endHour,
        duration,
        $or: [
          { booked: false },
          { stickyUntil:{ $lt: new Date() } }
        ]
      },
      {
        $set: {
          booked: true,
          bookedBy: userId,
          postId,
          bookedAt: new Date(),
          stickyUntil,
         bookingGroupId,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) ,stickyUntil
        }
      },
      { new: true, upsert: true }
    );

    // Notify all clients
    io.emit("slotBooked", { 
      startHour, 
      endHour,
      duration,
      bookedBy: userId,
      postId
    });

    res.status(200).json({
      success: true,
      slot: bookedSlot
    });

  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ error: "Booking failed" });
  }
};*/
}

{/*export const bookSlot = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { startHour, endHour, duration, postId } = req.body;
    const userId = req.user.id;
    const now = new Date();
    const stickyUntil = new Date(now.getTime() + duration * 60 * 60 * 1000);
    const bookingGroupId = new mongoose.Types.ObjectId();

    // 1. Check for existing active bookings
    const existingBooking = await Slot.findOne({
      startHour,
      endHour,
      duration,
      booked: true,
      $or: [{ expiresAt: { $gt: now } }, { pinnedUntil: { $gt: now } }],
    }).session(session);

    if (existingBooking) {
      await session.abortTransaction();
      return res.status(409).json({
        error: "Slot already booked",
        conflict: existingBooking,
      });
    }

    // 2. Book the slot atomically
    const bookedSlot = await Slot.findOneAndUpdate(
      {
        startHour,
        endHour,
        duration,
        $or: [
          { booked: false },
          { expiresAt: { $lt: now } },
          { pinnedUntil: { $lt: now } },
        ],
      },
      {
        $set: {
          booked: true,
          bookedBy: userId,
          postId,
          bookedAt: now,
          stickyUntil,
          bookingGroupId,
          expiresAt: new Date(now.getTime() + 15 * 60 * 1000), // 15 min reservation window
        },
      },
      { new: true, session }
    );

    if (!bookedSlot) {
      await session.abortTransaction();
      return res.status(409).json({ error: "Slot no longer available" });
    }

    await session.commitTransaction();

    // 3. Notify all clients
    io.emit("slotBooked", {
      startHour,
      endHour,
      duration,
      bookedBy: userId,
      postId,
    });

    res.status(200).json({
      success: true,
      slot: bookedSlot,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Booking error:", error);
    res.status(500).json({ error: "Booking failed" });
  } finally {
    session.endSession();
  }
};}*/}

export const bookSlot = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { startHour, endHour, duration, postId } = req.body;
    const userId = req.user.id;
    const now = new Date();
    const bookingGroupId = new mongoose.Types.ObjectId();

    // 1. Check for existing active bookings
    const existingBooking = await Slot.findOne({
      startHour,
      endHour,
      duration,
      booked: true,
      $or: [{ expiresAt: { $gt: now } }, { pinnedUntil: { $gt: now } }],
    }).session(session);

    if (existingBooking) {
      await session.abortTransaction();
      return res.status(409).json({
        error: "Slot already booked",
        conflict: existingBooking,
      });
    }

    // Calculate the next occurrence of the booked slot time in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Start of today in UTC
    
    // Create the scheduled start time in UTC
    const scheduledStartUTC = new Date(today);
    scheduledStartUTC.setUTCHours(startHour, 0, 0, 0);
    
    // If time has already passed today, schedule for tomorrow
    if (scheduledStartUTC < now) {
      scheduledStartUTC.setUTCDate(scheduledStartUTC.getUTCDate() + 1);
    }

    // Calculate end time in UTC
    const scheduledEndUTC = new Date(scheduledStartUTC);
    scheduledEndUTC.setUTCHours(scheduledStartUTC.getUTCHours() + duration);

    // 2. Book the slot atomically
    const bookedSlot = await Slot.findOneAndUpdate(
      {
        startHour,
        endHour,
        duration,
        $or: [
          { booked: false },
          { expiresAt: { $lt: now } },
          { pinnedUntil: { $lt: now } },
        ],
      },
      {
        $set: {
          booked: true,
          bookedBy: userId,
          postId,
          bookedAt: now,
          stickyUntil: scheduledEndUTC, // Use the calculated end time
          bookingGroupId,
          expiresAt: new Date(now.getTime() + 15 * 60 * 1000), // 15 min reservation window
          scheduledStartUTC, // Store the calculated start time
          scheduledEndUTC,   // Store the calculated end time
        },
      },
      { new: true, session }
    );

    if (!bookedSlot) {
      await session.abortTransaction();
      return res.status(409).json({ error: "Slot no longer available" });
    }

    await session.commitTransaction();

    // 3. Notify all clients
    io.emit("slotBooked", {
      startHour,
      endHour,
      duration,
      bookedBy: userId,
      postId,
      scheduledStartUTC,
      scheduledEndUTC
    });

    res.status(200).json({
      success: true,
      slot: bookedSlot,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Booking error:", error);
    res.status(500).json({ error: "Booking failed" });
  } finally {
    session.endSession();
  }
};

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