import Post from "../Model/postModel.js";
import Admin from "../Model/adminModel.js"
import bcrypt from "bcrypt";
import { sendSMS } from "../utils/sendSMS.js";
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
      updateFields.stickyUntil = new Date(Date.now() + parseInt(stickyDuration));
    }
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { status }, updateFields,
            { new: true }
        ).populate('userId', 'username email phoneNumber');

        if (!updatedPost) {
            return res.status(404).json({ message: "Post not found" });
        }
         // Convert username to Hindi using Google Translate API
         let translatedUsername;
         try {
             const translation = await translate(updatedPost.userId.username, { to: "hi" });
             translatedUsername = translation.text;
         } catch (error) {
             console.error('Translation error:', error);
             translatedUsername = updatedPost.userId.username; // Fallback
         }
         
            

        // Ensure the user exists before sending the notification
        if (updatedPost?.userId?.email) {
            const userName = updatedPost.userId.username; // Fetch username
            const userEmail = updatedPost.userId.email; // Fetch user email
            const status = updatedPost.status;

            if (status === "approved") {
                // Email for approved post
                const subject = "Your Post is Live – Let the World Hear Your Voice! 🌍✨";
         await sendNotificationEmail(userEmail, subject, null,getPostLiveEmailTemplate(userName));
            } else if (status === "rejected") {
                // Email for rejected post
                const subject = "Let’s Refine Your Post – You’re Almost There! 🚀";
             await sendNotificationEmail(userEmail, subject, null,getPostRejectionEmailTemplate(userName))
            }}





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
