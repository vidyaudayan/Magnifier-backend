import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../Model/userModel.js"; // Adjust the import path if necessary
import JobApplication from "../Model/jobApplicationModel.js";
import { cloudinaryInstance } from "../config/cloudinary.js";
import Post from "../Model/postModel.js";
import { sendOtpEmail } from "../config/nodeMailer.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import twilio from "twilio";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { sendNotificationEmail } from "../config/notifications.js";
dotenv.config();
import { sendSMS } from "../utils/sendSMS.js";
import translate from "@vitalets/google-translate-api";
import getSignupEmailTemplate from "../templates/signupMessage.js";
import getLoginEmailTemplate from "../templates/loginMessage.js";
import getJobApplicationEmailTemplate from "../templates/jobMessage.js";
import { uploadToS3 } from "../utils/s3Uploader.js";
import admin from "../config/firebase.js";
import { check, validationResult }from 'express-validator'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const otpMap = new Map();
const signup = async (req, res) => {
  try {
    const {
      name,
      username,
      fathersName, dateOfBirth,
      age,
      gender,
      vidhanSabha,
      wardNumber,state,
      email,
      password, phone,
      phoneNumber,
    } = req.body;
    const userAge = age || (dateOfBirth ? calculateAge(new Date(dateOfBirth)) : null);
    
    // Map phone to phoneNumber if needed
    const userPhone = phoneNumber || phone;

    // Validate mandatory fields
    if (
      !name ||
      !username ||
     
      !email ||
      !password || !userPhone)
     {
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });
    }

    const validStates = ['Delhi', 'Bihar', 'West Bengal'];
    if (!validStates.includes(state)) {
      return res.status(400).json({ message: "Invalid state provided." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a new user
    const newUser = new User({
      name,
      username,
      fathersName,
      age: userAge,
      gender,
      wardNumber: wardNumber ? Number(wardNumber) : null,
      vidhanSabha,state,
      email,
      password: hashedPassword,
      phoneNumber: userPhone,
      isEmailVerified: false,
      isPhoneVerified: false,
      isVerified: true,
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    // Generate a JWT token
    const token = jwt.sign(
      { id: savedUser._id, email: savedUser.email },
      process.env.JWT_SECRET, // Use a secure secret key from environment variables
      { expiresIn: "24h" } // Token expiration time
    );

    // Send login notification
    if (savedUser.email) {
      await sendNotificationEmail(
        savedUser.email,
        "Welcome to Magnifier - Your Journey to Greatness Begins! 🌟",null,
        getSignupEmailTemplate(savedUser.username)
      );
    } 

     // Send welcome notification SMS
     if (savedUser.phoneNumber) {
      console.log("Phone number before sending SMS:", savedUser.phoneNumber);
      await sendSMS(savedUser.phoneNumber,  `Hello ${savedUser.name}, A warm and heartfelt welcome to the Magnifier Family`);
    }


    // Send response with the token
    res.status(201).json({
      message: "Signup successful.",
      success: true,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        username: savedUser.username,
        phoneNumber: savedUser.phoneNumber,
        isVerified: savedUser.isVerified,
        profilePic: savedUser.profilePic || "default-pic-url.jpg",
      },
      error: false,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong during signup." });
  }
};


function calculateAge(birthDate) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
// job application



export const applyJob = async (req, res) => {
  const { jobApplicationDetails } = req.body;
  const parsedDetails = JSON.parse(jobApplicationDetails);
  try {
    //const { voterCardNumber, aadhaarNumber, experience, qualification } = req.body;
    const { username, experience, qualification } = parsedDetails;
    const file = req.file;

    // Verify if username exists in the database
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid username. Please sign up." });
    }

    const user = await User.findOne({ username });
    
    // Handle file upload
    let resumeUrl = null;
    if (file) {
      try {
        const uploadResult = await uploadToS3(file, 'resume');
resumeUrl = uploadResult.url;

      } catch (uploadError) {
        console.error("Error uploading to s3", uploadError);
        return res
          .status(500)
          .json({ success: false, message: "Resume upload failed" });
      }
    }

    // Save job application
    const jobApplication = new JobApplication({
      userId: existingUser._id,
      username,
      experience,
      qualification,
      resume: resumeUrl, // Save Cloudinary URL if available
    });

    await jobApplication.save();

    

    // Send job application notification
    if (user.email) {
      await sendNotificationEmail(
        user.email,
        "Thank You for Applying – Let’s Build the Future Together! 🚀",null,
        getJobApplicationEmailTemplate(user.username)
      );
    }


    // Send job application notification SMS
    if (user.phoneNumber) {
      await sendSMS(user.phoneNumber,  `Thank you ${user.username}, for submitting job application`);
    }

    res.status(200)
      .json({
        success: true,
        message: "Job application submitted successfully",
      });
  } catch (error) {
    console.error("Error submitting job application:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error submitting job application",
        error,
      });
  }
};

// Login Controller
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(req.body);
    // Check if the user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    {
      /*if (user.isFirstLogin) {
      user.walletAmount = 100; // Set wallet to 100 for the first login
      user.isFirstLogin = false; // Mark as not the first login
  }*/
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate a JWT (optional, for session management)
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    // **Check if it's the first login**
    if (user.isFirstLogin) {
      // Send welcome email
      if (user.email) {
        await sendNotificationEmail(
          user.email,"Congratuations - 🎉 Thank you for joining us. Share your thoughts, spark conversations, and make an impact! 🚀 🌟",null,
          getLoginEmailTemplate(user.username)
        );
      }

       // Send SMS for first login
       if (user.phoneNumber) {
        const smsMessage = `Welcome to Magnifier, ${user.username}! 🎉 Thank you for joining us. Share your thoughts, spark conversations, and make an impact! 🚀`;
        await sendSMS(user.phoneNumber, smsMessage);
      }

      // Set first login flag to false
      user.isFirstLogin = false;
      await user.save();
    }

    // Send success response
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        profilePic: user.profilePic,
        walletAmount: user.walletAmount,
      },
      token, // Send the token if you're using JWT
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// profile pic

export const addProfilePic = async (req, res) => {
  const userId = req.user.id;
  const file = req.file;
  
  if (!file) {
    return res.status(400).json({ success: false, message: "No file provided" });
  }

  try {
    let profilePicUrl = null;
    
    try {
      const uploadResult = await uploadToS3(file, "images");
      profilePicUrl = uploadResult.url; // Remove the 'const' here to use the outer variable
    
      if (!profilePicUrl) {
        throw new Error("Failed to upload to S3");
      }
    } catch (uploadError) {
      console.error("Error uploading to Amazon S3", uploadError);
      return res.status(500).json({ 
        success: false, 
        message: "Profilepic upload failed" 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { profilePic: profilePicUrl },
      { new: true }
    ).lean();

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.status(200).json({
      message: "Profile picture updated",
      user,
      profilePic: profilePicUrl,
    });
  } catch (err) {
    console.error("profile pic", err);
    res.status(500).json({ 
      error: "Server error", 
      details: err.message 
    });
  }
};

// get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    //const userId = req.params.id; // Get the user ID from URL params
    // const user = await User.findById(userId).select("-password");

    console.log(user);
    if (!user) {
      return res.status(404).send("User not found");
    }

    res.status(200).json({
      username: user.username,
      profilePic: user.profilePic,
      email: user.email,
      coverPic: user.coverPic,
      rechargedPoints:user.rechargedPoints,
      earnedPoints:user.earnedPoints
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

// Get user posts

export const getUserPosts = async (req, res) => {
  try {
    // Ensure the user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    // Get the logged-in user's ID
    const userId = req.user.id;

    // Fetch all posts created by the user
    const userPosts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "comments.userId",
        select: "username profilePic", // Fetch only required fields
      }); // Sort by most recent

    // If no posts found, return an appropriate message
    if (!userPosts.length) {
      return res.status(404).json({ message: "No posts found for this user" });
    }

    // Respond with the user's posts
    res.status(200).json({
      success: true,
      data: userPosts,
      message: "User posts fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch user posts", error });
  }
};

// Log out
export const logout = async (req, res) => {
  res.status(200).json({ message: "User logged out successfully." });
};

// Wallet

export const initializeWallet = async (req, res) => {
  try {
    const userId = req.user.id; // Assume user ID is available in the token
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.walletAmount === 0) {
      user.walletAmount = 100;
      await user.save();
    }

    res
      .status(200)
      .json({ message: "Wallet initialized", walletAmount: user.walletAmount });
  } catch (error) {
    res.status(500).json({ message: "Error initializing wallet", error });
  }
};

// user matrics
{/*export const getUserMetrics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch posts by the user
    const posts = await Post.find({ userId });

    // Calculate likes, dislikes, and post count
    const totalLikesOnPosts = posts.reduce(
      (sum, post) => sum + (post.likes || 0),
      0
    );
    const totalDislikesOnPosts = posts.reduce(
      (sum, post) => sum + (post.dislikes || 0),
      0
    );

    const postCount = posts.length;

    const totalImpressions = posts.reduce((sum, post) => sum + (post.impressions || 0), 0);

    // Update wallet amount
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Handle first login to add an initial wallet amount of 100
    if (user.walletAmount === 0 && user.isFirstLogin) {
      user.walletAmount = 100; // Add initial wallet amount
      user.isFirstLogin = false; // Mark that the initial login setup is complete
    }
    // Calculate the total wallet amount based on reactions
    const calculatedWalletAmount =
      (totalLikesOnPosts + totalDislikesOnPosts) * 10;

    // Update walletAmount ONLY if it differs from the calculated amount
    if (
      user.walletAmount !== 100 &&
      user.walletAmount !== calculatedWalletAmount
    ) {
      user.walletAmount += calculatedWalletAmount;
    }

    // Calculate total likes and dislikes made by the user on other posts
    const totalLikes = user.reactions.filter(
      (reaction) => reaction.reactionType === "like"
    ).length;
    const totalDislikes = user.reactions.filter(
      (reaction) => reaction.reactionType === "dislike"
    ).length;

    //user.walletAmount += (totalLikes + totalDislikes) * 10;
    await user.save();

    //const walletAmount = (totalLikes + totalDislikes) * 10;

    res.status(200).json({
      userName: user.username, // Include user name
      profilePicture: user.profilePic, // Include profile picture
        rechargedPoints:user.rechargedPoints,
      earnedPoints:user.earnedPoints,
      postCount,
      totalLikes,
      totalDislikes,
      totalLikesReceived: totalLikesOnPosts, // Likes received on user's posts
  totalDislikesReceived: totalDislikesOnPosts,
      walletAmount: user.walletAmount,totalImpressions
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching metrics", error });
  }
};*/}

export const getUserMetrics = async (req, res) => {
  try {
    

    const userId = req.user.id;

    // Get user with only necessary fields
    const user = await User.findById(userId)
      .select('username profilePic walletAmount earnedPoints rechargedPoints reactions isFirstLogin')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Initialize wallet for first login
    if (user.isFirstLogin && user.walletAmount === 0) {
      await User.updateOne({ _id: userId }, { 
        walletAmount: 100,
        isFirstLogin: false 
      });
      user.walletAmount = 100;
    }

    // Get post metrics using aggregation
    const [postMetrics] = await Post.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          postCount: { $sum: 1 },
          totalLikesReceived: { $sum: "$likes" },
          totalDislikesReceived: { $sum: "$dislikes" },
          totalImpressions: { $sum: "$impressions" },
          pinnedPosts: { $sum: { $cond: [{ $eq: ["$sticky", true] }, 1, 0] } }
        }
      }
    ]);

    // Prepare response
    const responseData = {
      user: {
        username: user.username,
        profilePic: user.profilePic,
        walletAmount: user.walletAmount,
        earnedPoints: user.earnedPoints,
        rechargedPoints: user.rechargedPoints,
        totalPoints: user.earnedPoints + user.rechargedPoints
      },
      posts: {
        count: postMetrics?.postCount || 0,
        likesReceived: postMetrics?.totalLikesReceived || 0,
        dislikesReceived: postMetrics?.totalDislikesReceived || 0,
        impressions: postMetrics?.totalImpressions || 0,
        pinned: postMetrics?.pinnedPosts || 0
      },
      reactions: {
        likesGiven: user.reactions.filter(r => r.reactionType === 'like').length,
        dislikesGiven: user.reactions.filter(r => r.reactionType === 'dislike').length
      }
    };

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error("Metrics Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// send email otp

export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Find the user in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiration = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity
console.log("email otp",otp)
    // Update user record with new OTP
    user.otp = otp;
    user.otpExpiration = otpExpiration;
    await user.save();

    // Send OTP via email
    await sendOtpEmail(email, otp);

    res.status(200).json({ message: "OTP sent successfully to email." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending OTP." });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    // Find the user in the database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if OTP is valid and not expired
    if (user.otp !== otp || user.otpExpiration < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Update user to mark email as verified
    user.isEmailVerified = true;
    user.otp = null; // Clear OTP after verification
    user.otpExpiration = null;
    await user.save();

    // Generate JWT token for the user
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Email verified successfully.",
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error verifying OTP." });
  }
};

// Forgot Password Controller
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate Reset Token
    const resetToken = crypto.randomBytes(32).toString("hex"); // Random string
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set the token and expiration time in the user document
    //user.resetPasswordToken = hashedToken;
    //user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes expiry time

    user.resetToken = hashedToken;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour expiration

    await user.save();

    // Create the reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send Reset Password Email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.EMAIL_USERNAME, // Email username from .env
        pass: process.env.EMAIL_PASSWORD, // Email password from .env
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates if needed
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "Reset Your Password",
      html: `
          <p>To reset your password, click on the following link:</p>
          <a href="${resetUrl}" target="_blank">Reset Password</a>
      `,
    };

    // Sending the email
    await transporter.sendMail(mailOptions);

    // Return success message
    res
      .status(200)
      .json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("Error sending reset email:", error);
    res.status(500).json({ message: "Server error, please try again later." });
  }
};

// Reset password


export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    console.log(req.body);
    // Validate input fields
    if (!resetToken || !newPassword) {
      return res
        .status(400)
        .json({ message: "Invalid request. Missing fields." });
    }

    // Hash the token received in the request
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    console.log("hash token", hashedToken);
    // Find the user with the provided token and check if it is still valid
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiration: { $gt: Date.now() }, // Token must be valid and not expired
    });
    console.log("user", user);
    // If no user found, return error
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the user with the new password and clear reset fields
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;

    // Save the updated user
    await user.save();

    res.status(200).json({
      message: "Password reset successful.",
      success: true,
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// search users

export const userSearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res
        .status(400)
        .json({ success: false, message: "Search query is required" });
    }

    const users = await User.find({
      username: { $regex: query, $options: "i" }, // Case-insensitive search
    }).select("username profilePic"); // Return only required fields

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// get posts of searched user

export const getSearchedUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    const posts = await Post.find({ userId })
    .populate("userId", "username profilePic")
    .populate("comments.userId", "username profilePic")
      .sort({ createdAt: -1 }); // Adjust sorting if needed

    const user = await User.findById(userId).select("username profilePic");
    if (!posts.length) {
      return res.status(200).json({ success: true, data: [], user }); // No posts found
    }

    res.status(200).json({ success: true, data: posts, user });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// cover pic



export const addCoverPic = async (req, res) => {
  const userId = req.user.id;
  const file = req.file;

  if (!file) {
    return res
      .status(400)
      .json({ success: false, message: "No file provided" });
  }

  try {
    // Upload the cover pic to S3 under "profiles" folder
    const uploadResult = await uploadToS3(file, "profiles");

    const coverPicUrl = uploadResult.url;
    if (!coverPicUrl) {
      throw new Error("Failed to upload to S3");
    }

    // Update user's coverPic field in database
    const user = await User.findByIdAndUpdate(
      userId,
      { coverPic: coverPicUrl },
      { new: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      message: "Cover picture updated",
      user,
      coverPic: coverPicUrl
    });
  } catch (err) {
    console.error("Cover pic upload error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};


// send mobile otp

{/*const normalizePhoneNumber = (phoneNumber) => {
  phoneNumber = phoneNumber.replace(/[^0-9]/g, "");
  return phoneNumber.startsWith("91") ? `+${phoneNumber}` : `+91${phoneNumber}`;
};

export const sendMobileOtp = (req, res) => {
  console.log("Request body:", req.body); // Debugging log
  let { phoneNumber } = req.body;
 // phoneNumber = normalizePhoneNumber(phoneNumber);
  if (!phoneNumber)
    return res.status(400).json({ error: "Phone number is required" });

 

 phoneNumber = normalizePhoneNumber(phoneNumber); // Normalize the phone number
 console.log("Formatted phone number:", phoneNumber);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpMap.set(phoneNumber, otp);
  console.log(`Generated OTP for ${phoneNumber}: ${otp}`);

  client.messages
    .create({
      body: `Your OTP is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    })
    .then(() => {
      console.log(`OTP sent to ${phoneNumber}`);
      res.json({ message: "OTP sent successfully" });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
};

// verify mobile otp send



export const verifyMobileOtp = async (req, res) => {
  try {
    let { phoneNumber, otp } = req.body;
    
    // Validate input
    if (!phoneNumber || !otp) {
      return res.status(400).json({ 
        success: false,
        error: "Phone number and OTP are required" 
      });
    }

    // Normalize phone number
    phoneNumber = normalizePhoneNumber(phoneNumber);
    console.log("Verification request for:", phoneNumber);

    // Verify OTP
    const storedOtp = otpMap.get(phoneNumber);
    console.log(`Stored OTP: ${storedOtp}, Received OTP: ${otp}`);

    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid OTP" 
      });
    }

    // Find or create user
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({ phoneNumber });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, phoneNumber }, 
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Clear used OTP
    otpMap.delete(phoneNumber);

    return res.json({
      success: true,
      message: "OTP verified successfully",
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber
      }
    });

  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};*/}

// Deactivate account

export const deactivateUserAccount = async (req, res) => {
  const userId = req.user.id;
  console.log("deactivate", userId);
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false, deactivatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User account deactivated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error deactivating user account", error });
  }
};

// Get profile by ID

export const getProfileById = async (req, res) => {
  try {
    const userId = req.params.id; // Get the user ID from URL params
    const user = await User.findById(userId).select("-password"); // Exclude password field

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      username: user.username,
      profilePic: user.profilePic,
      email: user.email,
      coverPic: user.coverPic,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete profile pic
export const deleteProfilePic = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Find the user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 2. Check if user has a profile picture
    if (!user.profilePic) {
      return res.status(400).json({ 
        success: false, 
        message: "No profile picture exists to delete" 
      });
    }

    // 3. Extract public ID from Cloudinary URL
    const profilePicUrl = user.profilePic;
    const publicId = profilePicUrl.split('/').slice(-2).join('/').split('.')[0];

    // 4. Delete from Cloudinary
    try {
      await cloudinaryInstance.uploader.destroy(publicId);
    } catch (cloudinaryError) {
      console.error("Cloudinary deletion error:", cloudinaryError);
      // Continue with deletion even if Cloudinary fails
      // You might want to handle this differently in production
    }

    // 5. Update user in database
    user.profilePic = null;
    await user.save();

    // 6. Return success response
    res.status(200).json({ 
      success: true,
      message: "Profile picture deleted successfully",
      user
    });

  } catch (err) {
    console.error("Error deleting profile picture:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error", 
      details: err.message 
    });
  } 
};
// firebase
// In your backend (send-mobileotp endpoint)
export const sendMobileOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Format phone number
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    // Create user record (optional) and get UID
    const userRecord = await admin.auth().createUser({
      phoneNumber: formattedPhone
    });
    
    res.json({ 
      success: true, 
      verificationId: userRecord.uid // Using UID as verification ID
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    
    // More specific error handling
    if (error.code === 'auth/invalid-phone-number') {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    res.status(500).json({ 
      error: 'Failed to send OTP',
      details: error.message 
    });
  }
} 



export const verifyMobileOtp = async (req, res) => {
  try {
    const { idToken } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!idToken || !token) {
      return res.status(400).json({ 
        success: false,
        error: 'ID token and authorization token are required' 
      });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Here you can associate the Firebase UID with your user in database
    // Example: Update user record with Firebase UID
    
    res.json({ 
      success: true,
      message: 'Mobile number verified successfully',
      firebaseUid: decodedToken.uid
    });
    
  } catch (error) {
    console.error('Error verifying OTP:', error);
    
    let statusCode = 400;
    let errorMessage = 'Invalid OTP';
    
    if (error.code === 'auth/id-token-expired') {
      statusCode = 401;
      errorMessage = 'Token expired';
    } else if (error.code === 'auth/argument-error') {
      errorMessage = 'Invalid token format';
    }
    
    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      details: error.message 
    });
  }
}

export const deleteCoverPic = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 2. Check if user has a cover picture
    if (!user.coverPic) {
      return res.status(400).json({ 
        success: false, 
        message: "No cover picture exists to delete" 
      });
    }

    // 3. Extract public ID from Cloudinary URL (or S3 key if using S3)
    const coverPicUrl = user.coverPic;
    let publicId;
    
    // For Cloudinary URLs
    if (coverPicUrl.includes('cloudinary')) {
      publicId = coverPicUrl.split('/').slice(-2).join('/').split('.')[0];
      // Delete from Cloudinary
      try {
        await cloudinaryInstance.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error("Cloudinary deletion error:", cloudinaryError);
      }
    }
    // For S3 URLs - you would need to implement S3 deletion logic here
    // else if (coverPicUrl.includes('s3.amazonaws.com')) {
    //   // Implement S3 deletion logic
    // }

    // 4. Update user in database
    user.coverPic = null;
    await user.save();

    // 5. Return success response
    res.status(200).json({ 
      success: true,
      message: "Cover picture deleted successfully",
      user
    });

  } catch (err) {
    console.error("Error deleting cover picture:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error", 
      details: err.message 
    });
  } 
};

// pay fron wallet 



{/*export const payFromWallet = async (req, res) => {
  try {
    const { postId, amount, duration, startHour, endHour, stickyStartUTC, stickyEndUTC } = req.body;
    const userId = req.user.id;

    // 1. Validate the request
    if (!postId || !amount || !duration || !stickyStartUTC || !stickyEndUTC) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    // 2. Check if user has sufficient balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    if (user.walletAmount < amount) {
      return res.status(400).json({ 
        success: false,
        error: 'Insufficient wallet balance' 
      });
    }

    // 3. Verify the post exists and belongs to the user
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        error: 'Post not found' 
      });
    }

    if (post.userId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized to pin this post' 
      });
    }

     if (!['pending', 'approved', 'rejected'].includes(post.status)) {
      post.status = 'pending';
    }

    // Calculate new balance
    const newBalance = user.walletAmount - amount;

    // 4. Create transaction record (embedded in user)
    const transaction = {
      type: 'pinned_post',
      amount: -amount,
     
      timestamp: new Date(),
      referenceModel: 'Post',
      reference: postId,
      balanceAfter: newBalance,
      description: `Post pinning for ${duration} hours`
    };

    // 5. Update user and post in a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update user's wallet and add transaction
      user.walletAmount = newBalance;
      user.earnedPoints -= amount; // Or rechargedPoints depending on your logic
      user.walletTransactions.push(transaction);
      await user.save({ session });

      // Update post
      post.sticky = true;
      post.stickyDuration = duration;
      post.stickyStartUTC = stickyStartUTC;
      post.stickyEndUTC = stickyEndUTC;
      post.stickyUntil = new Date(stickyEndUTC);
      await post.save({ session });
      
      await session.commitTransaction();
      session.endSession();

      res.json({ 
        success: true,
        message: 'Post pinned successfully',
        newBalance: user.walletAmount
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('Error in payFromWallet:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to process wallet payment' 
    });
  }
};*/}

export const payFromWallet = async (req, res) => {
  try {
    const { postId, amount, duration, startHour, endHour, stickyStartUTC, stickyEndUTC } = req.body;
    const userId = req.user.id;

    // 1. Validate the request
    if (!postId || !amount || !duration || !stickyStartUTC || !stickyEndUTC) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    // 2. Check if user has sufficient balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    if (user.totalPoints < amount) {
      return res.status(400).json({ 
        success: false,
        error: 'Insufficient wallet balance' 
      });
    }

    // 3. Verify the post exists and belongs to the user
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        error: 'Post not found' 
      });
    }

    if (post.userId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized to pin this post' 
      });
    }

    if (!['pending', 'approved', 'rejected'].includes(post.status)) {
      post.status = 'pending';
    }

    // Calculate how to deduct from each balance
    let remainingAmount = amount;
    let deductedFromRecharged = 0;
    let deductedFromEarned = 0;

    // First deduct from recharged points
    if (user.rechargedPoints > 0) {
      deductedFromRecharged = Math.min(user.rechargedPoints, remainingAmount);
      user.rechargedPoints -= deductedFromRecharged;
      remainingAmount -= deductedFromRecharged;
    }

    // Then deduct from earned points if needed
    if (remainingAmount > 0 && user.earnedPoints > 0) {
      deductedFromEarned = Math.min(user.earnedPoints, remainingAmount);
      user.earnedPoints -= deductedFromEarned;
      remainingAmount -= deductedFromEarned;
    }

    // Update total points
    user.totalPoints = user.rechargedPoints + user.earnedPoints;

    // 4. Create transaction record
    const transaction = {
      type: 'pinned_post',
      amount: -amount,
      timestamp: new Date(),
      referenceModel: 'Post',
      reference: postId,
      balanceAfter: user.totalPoints,
      description: `Post pinning for ${duration} hours`,
      details: {
        deductedFromRecharged,
        deductedFromEarned
      }
    };

    // 5. Update user and post in a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update user's wallet and add transaction
      user.walletTransactions.push(transaction);
      await user.save({ session });

      // Update post
      post.sticky = true;
      post.stickyDuration = duration;
      post.stickyStartUTC = stickyStartUTC;
      post.stickyEndUTC = stickyEndUTC;
      post.stickyUntil = new Date(stickyEndUTC);
      await post.save({ session });
      
      await session.commitTransaction();
      session.endSession();

      res.json({ 
        success: true,
        message: 'Post pinned successfully',
        newBalance: user.totalPoints,
        deductedFromRecharged,
        deductedFromEarned
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('Error in payFromWallet:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to process wallet payment' 
    });
  }
};  
  
export const verifyCredentials = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id; 

    const user = await User.findById(userId).select('+password');
    
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        valid: false,
        error: "Invalid credentials" 
      });
    }

    res.status(200).json({ 
      success: true,
      valid: true,
      message: "Credentials verified successfully" 
    });

  } catch (error) {
    
  }
};

// Redeem 
   

export const redeemPoints = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
       
  try {
    const { points } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!points || isNaN(points) || points <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid points amount'
      });
    }

    const redeemPoints = parseInt(points);

    // Find user with session for transaction
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });  
    }  

    // Check sufficient balance using virtual
    if (redeemPoints > user.totalPoints) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Insufficient points balance'
      });
    }

    // Calculate deduction
    let pointsFromEarned = Math.min(user.earnedPoints, redeemPoints);
    let pointsFromRecharged = redeemPoints - pointsFromEarned;

    // Update points
    user.earnedPoints -= pointsFromEarned;
    user.rechargedPoints -= pointsFromRecharged;

    // Create transaction record
    const transaction = {
      type: 'withdraw',
      amount: redeemPoints,
      status: 'success',
      description: 'Points redemption',
      balanceAfter: user.totalPoints - redeemPoints,
      timestamp: new Date(),
      metadata: {
        pointsFromEarned,
        pointsFromRecharged
      }
    };

    // Add transaction to user's walletTransactions
    user.walletTransactions.push(transaction);

    // Save user with transaction
    await user.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Points redeemed successfully',
      data: {
        earnedPoints: user.earnedPoints,
        rechargedPoints: user.rechargedPoints,
        totalPoints: user.totalPoints
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error redeeming points:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to redeem points',
      error: error.message
    });
  }
};

export default signup;
