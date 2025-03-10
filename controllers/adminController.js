import Post from "../Model/postModel.js";
import Admin from "../Model/adminModel.js"
import Slot from "../Model/slotModel.js";
import User from "../Model/userModel.js";
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

 export const getAvailableSlots= async (req, res) => {
  try {
    const { duration } = req.query; // 1, 3, 6, or 12 hours

    if (![1, 3, 6, 12].includes(parseInt(duration))) {
        return res.status(400).json({ error: "Invalid duration" });
    }

    let availableSlots = [];

    for (let hour = 0; hour <= 24 - duration; hour++) {
        // Check if all hours in this range are available
        const slotRange = await Slot.find({ 
            hour: { $gte: hour, $lt: hour + parseInt(duration) },
            booked: false 
        });

        if (slotRange.length === parseInt(duration)) {
            availableSlots.push({ startHour: hour, endHour: hour + parseInt(duration) });
        }
    }

    res.json(availableSlots);
} catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ error: "Error fetching slots" });
}
}

// Pin post

{/*export const pinPost= async (req, res) => {
  try {
      const { postId, slotHour,stickyDuration } = req.body;

      // Check if the slot is available
      const slot = await Slot.findOne({ hour: slotHour, booked: false });
      if (!slot) {
          return res.status(400).json({ message: "Slot already booked" });
      }

       // Calculate the start time (when the post should become sticky)
       const now = new Date();
       const startTime = new Date(now);
       startTime.setHours(slotHour, 0, 0, 0);

      // Calculate expiration time (3 hours later)
      const expirationTime = new Date();
      //expirationTime.setHours(expirationTime.getHours() + 3);
      expirationTime.setHours(expirationTime.getHours() + stickyDuration);

      // Pin the post
      const post = await Post.findByIdAndUpdate(postId, {
          sticky: true,
          stickyUntil: expirationTime, stickyDuration
      });

      // Mark the slot as booked
      slot.booked = true;
      slot.bookedBy = postId;
      slot.bookedAt = new Date();
      await slot.save();

      res.json({ message: "Post pinned for ${stickyDuration}!", stickyUntil: expirationTime });
  } catch (error) {
      res.status(500).json({ error: "Error pinning post" });
  }
};*/}

export const pinPost = async (req, res) => {
  try {
      const { postId, slotHour, stickyDuration } = req.body;

      const now = new Date();
      const startTime = new Date(now);
      startTime.setHours(slotHour, 0, 0, 0); // Set to the selected slot start time (e.g., 11 AM)

      // Calculate expiration time based on selected duration
      const expirationTime = new Date(startTime);
      expirationTime.setHours(expirationTime.getHours() + stickyDuration);

      // Update post: sticky = false initially, activate at startTime
      const post = await Post.findByIdAndUpdate(postId, {
          sticky: false, // Will activate later
          stickyUntil: expirationTime,
          scheduledStickyTime: startTime, // Track the scheduled start time
          stickyDuration
      });

      res.json({ 
          message: `Post scheduled for sticky at ${slotHour}:00 for ${stickyDuration} hours.`,
          stickyUntil: expirationTime 
      });

  } catch (error) {
      res.status(500).json({ error: "Error scheduling sticky post" });
  }
};



// book slot
{/*export const bookSlot= async (req, res) => {
  try {
    const { postId, startHour, endHour } = req.body;

    // Ensure all selected slots are free
    const freeSlots = await Slot.find({
        hour: { $gte: startHour, $lt: endHour },
        booked: false,
    });

    if (freeSlots.length !== (endHour - startHour)) {
        return res.status(400).json({ error: "One or more slots are already booked" });
    }

    // Mark slots as booked
    await Slot.updateMany(
        { hour: { $gte: startHour, $lt: endHour } },
        { booked: true, bookedBy: postId, bookedAt: new Date() }
    );

    // Update post sticky details
    await Post.findByIdAndUpdate(postId, {
        sticky: true,
        stickyUntil: new Date(Date.now() + (endHour - startHour) * 60 * 60 * 1000),
    });

    res.json({ message: "Slot booked successfully!" });
} catch (error) {
    console.error("Error booking slot:", error);
    res.status(500).json({ error: "Error booking slot" });
}
}*/}

export const bookSlot = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { postId, startHour, endHour } = req.body;

    // Step 1: Fetch the slots in a transaction to ensure accurate data
    const freeSlots = await Slot.find({
      hour: { $gte: startHour, $lt: endHour },
      booked: false,
    }).session(session);

    // Step 2: Check if all requested slots are free
    if (freeSlots.length !== endHour - startHour) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: "One or more slots are already booked" });
    }

    // Step 3: Mark slots as booked within the transaction
    await Slot.updateMany(
      { hour: { $gte: startHour, $lt: endHour }, booked: false },
      { booked: true, bookedBy: postId, bookedAt: new Date() },
      { session }
    );

    // Step 4: Update post sticky details
    const stickyUntil = new Date(Date.now() + (endHour - startHour) * 60 * 60 * 1000);

    await Post.findByIdAndUpdate(
      postId,
      { sticky: true, stickyUntil: stickyUntil },
      { session }
    );

    // Step 5: Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // **Emit event to update frontend in real-time**
    io.emit("slotBooked", { startHour, endHour });

    res.json({ message: "Slot booked successfully!", stickyUntil });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error booking slot:", error);
    res.status(500).json({ error: "Error booking slot" });
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