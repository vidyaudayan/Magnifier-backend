import Post from "../Model/postModel.js";
import Admin from "../Model/adminModel.js"
import Slot from "../Model/slotModel.js";
import User from "../Model/userModel.js";
import SlotReservation from "../Model/slotReservationModel.js";
import bcrypt from "bcrypt";
import { io } from "../index.js";
import { sendSMS } from "../utils/sendSMS.js";
import mongoose from "mongoose";
import translate from '@vitalets/google-translate-api'
import { sendNotificationEmail } from "../config/notifications.js";
import { adminToken } from "../utils/generateToken.js";
import getPostLiveEmailTemplate from "../templates/approvePostMesssage.js";
import getPostRejectionEmailTemplate from "../templates/rejecttedPostMessage.js";
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
      
      const { email, password } =req.body;
     
      const admin = await Admin.findOne({ email });
  
      if (!admin) {
        return res.status(404).send("Admin is not found");
      }

  const saltRounds = 10;
      const hashPassword = await bcrypt.hash(password, saltRounds);
      const matchPassword = await bcrypt.compare(
        password,
        hashPassword
      );
  
      console.log(matchPassword, "matchpassword");
      if (!matchPassword) {
        return res.send("password is not match");
      }
  
      const token = adminToken(admin);
      res.cookie("token", token,{secure: true, 
        sameSite: 'None', 
        httpOnly: true, 
        maxAge: 24 * 60 * 60 * 1000 });
      res.status(200).json({
        message : "Login successfully",
        data : token,
        success : true, admin: { id: admin._id, firstName: admin.firstName, email: admin.email },
        error : false
      })
    } catch (error) {
      console.error("Error", error);
      res.status(500).send("Internal Server Error");
    }
  };


// Fetch pending posts
export const fetchPendingPosts= async (req, res) => {
    try {
      const posts = await Post.find({ status: 'pending' }).populate('userId', 'email');
      res.json(posts);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };



// Approve a post
export const approvePost= async (req, res) => {
    try {
      const post = await Post.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
      
      
      
      
      res.json(post);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  // Reject a post
export const RejectPost= async (req, res) => {
    try {
      const post = await Post.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
      res.json(post);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  // update post status
 {/*export const updatePostStatus = async (req, res) => {
    const { postId, status } = req.body; // status: 'approved' or 'rejected'
    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    try {
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { status },
            { new: true }
        ).populate('userId', 'email');;
        if (!updatedPost) {
            return res.status(404).json({ message: "Post not found" });
        }

         // Ensure the user exists before sending the notification
    if (updatedPost.userId && updatedPost.userId.email) {
      await sendNotificationEmail(
        updatedPost.userId.email,
        "Post Status Update",
        `Hi, Your post "${updatedPost._id}" has been ${status}.`
      );
    }
        res.status(200).json({ message: `Post ${status}`, success: true });
    } catch (error) {
        console.error("Error updating post status:", error);
        res.status(500).json({ message: "Error updating post status", error });
    }
};*/}




export const updatePostStatus = async (req, res) => {
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
};


// Log out
export const logout= async (req, res) => {
  res.status(200).json({ success: true, message: "User logged out successfully." });
 }


 // Get avilable slots

{/*xport const getAvailableSlots= async (req, res) => {
  try {
    const { duration } = req.query; // 1, 3, 6, or 12 hours

    if (![1, 3, 6, 12].includes(parseInt(duration))) {
        return res.status(400).json({ error: "Invalid duration" });
    }

    let availableSlots = [];

    for (let hour = 0; hour <= 24 - duration; hour++) {
        // Check if all hours in this range are available
        const slotRange = await Slot.find({ 
            //hour: { $gte: hour, $lt: hour + parseInt(duration) },
            duration: parseInt(duration),
            booked: false 
        });

        if (slotRange.length === parseInt(duration)) {
            availableSlots.push({ startHour: hour, endHour: hour + parseInt(duration) });
        }
    }

    res.json( availableSlots.map(slot => ({
      startHour: slot.startHour,
      endHour: slot.endHour
    })));
} catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ error: "Error fetching slots" });
}
}*/}
{/*
export const getAvailableSlots = async (req, res) => {
  try {
    const { duration } = req.query;

    if (![1, 3, 6, 12].includes(parseInt(duration))) {
      return res.status(400).json({ error: "Invalid duration" });
    }

    // Directly query for slots of the requested duration that are available
    const availableSlots = await Slot.find({ 
      duration: parseInt(duration),
      booked: false 
    });

    // Format the response
    const formattedSlots = availableSlots.map(slot => ({
      startHour: slot.startHour,
      endHour: slot.endHour
    }));

    res.json(formattedSlots);
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ error: "Error fetching slots" });
  }
}*/}

export const getAvailableSlots = async (req, res) => {
  try {
    const { duration } = req.query;
    const now = new Date();

    // Get all unbooked slots of this duration
    const slots = await Slot.find({
      duration: parseInt(duration),
      $or: [
        { booked: false },
        { 
          $and: [
              { stickyUntil:{ $lt: now } }, // Pinning duration expired
              { booked: true }
          ]
      },
      { expiresAt: { $lt: now } } 
      ]
    });

    res.json(slots);
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ error: "Error fetching slots" });
  }
}    

// pin post new

export const pinPost = async (req, res) => {
  try {
    const { postId, slotHour } = req.body;
    
    // Get the reservation to find the duration
    const reservation = await SlotReservation.findOne({
      startHour: slotHour,
      status: "confirmed"
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
      stickyDuration: reservation.duration
    });

    res.json({
      message: `Post pinned for ${reservation.duration} hours.`,
      stickyUntil: expirationTime
    });

  } catch (error) {
    res.status(500).json({ error: "Error pinning post" });
  }
};




{/*
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
};*/}

// Updated bookSlot function
export const bookSlot = async (req, res) => {
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
}

// get all posts

export const getAllPosts=  async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).populate("userId", "name email vidhanSabha username"); // Fetch posts sorted by latest first
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};   