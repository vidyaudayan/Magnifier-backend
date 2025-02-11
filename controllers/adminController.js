import Post from "../Model/postModel.js";
import Admin from "../Model/adminModel.js"
import bcrypt from "bcrypt";
import { sendNotificationEmail } from "../config/notifications.js";
import { adminToken } from "../utils/generateToken.js";
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
        success : true,
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
 export const updatePostStatus = async (req, res) => {
    const { postId, status } = req.body; // status: 'approved' or 'rejected'
    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    try {
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { status },
            { new: true }
        );
        if (!updatedPost) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Send post approval notification
    
        await sendNotificationEmail(user.email, " Post status update", `Hi, Your post "${user._id}" is ${status}`);
      
        res.status(200).json({ message: `Post ${status}`, success: true });
    } catch (error) {
        console.error("Error updating post status:", error);
        res.status(500).json({ message: "Error updating post status", error });
    }
};


// Log out
export const logout= async (req, res) => {
  res.status(200).json({ message: "User logged out successfully." });
 }
