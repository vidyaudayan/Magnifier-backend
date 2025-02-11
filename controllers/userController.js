import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../Model/userModel.js'; // Adjust the import path if necessary
import JobApplication from '../Model/jobApplicationModel.js';
import { cloudinaryInstance } from '../config/cloudinary.js';
import Post from '../Model/postModel.js';
import { sendOtpEmail } from '../config/nodeMailer.js'
import crypto from 'crypto'; 
import nodemailer from 'nodemailer';
import twilio from 'twilio'
import dotenv from 'dotenv';
import { sendNotificationEmail } from '../config/notifications.js';
dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const otpMap = new Map();
const signup = async (req, res) => {
  try {
    const {
      name,
      username,
      fathersName,
      age,
      gender, vidhanSabha,
      wardNumber,
      email,
      password,
     
    } = req.body;

    // Validate mandatory fields
    if (!name|| !username || !age || !gender || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a new user
    const newUser = new User({
      name,
      username,
      fathersName,
      age,
      gender,
       wardNumber: wardNumber || null, vidhanSabha,
      email,
      password: hashedPassword,
     
      
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    // Generate a JWT token
    const token = jwt.sign(
      { id: savedUser._id, email: savedUser.email },
      process.env.JWT_SECRET, // Use a secure secret key from environment variables
      { expiresIn: '1h' } // Token expiration time
    );

    // Send response with the token
    res.status(201).json({
      message: "Signup successful.",
      success : true,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        username: savedUser.username,
    profilePic: savedUser.profilePic || "default-pic-url.jpg",
      },
      error:false, 
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong during signup." });
  }
};


// job application

{/*export const applyJob=async (req, res) => {
  const { userId, voterCardNumber, aadhaarNumber, experience, qualification } = req.body;
  const resume = req.file
  

  try {

    cloudinaryInstance.uploader.upload(req.file.path, async (err, result) => {
      if (err) {
        console.log(err, "error");
        return res.status(500).json({
          success: false,
          message: "Error",
        });
      }
      console.log(result);
      
      const resumeUrl = result.url;

      const body =JSON.parse(req.body.jobApplicationDetails)

      console.log("body", body);

      const { userId,
        voterCardNumber,
        aadhaarNumber,
        experience,
        qualification,
         } = body;

     

let parsedResume = [];


try {
  if (resume) {
    parsedResume = JSON.parse(resume);
  }
  
} catch (error) {
  return res.status(400).json({ success: false, message: "Invalid JSON format" });
}
    const jobApplication = new JobApplication({
      userId,
      voterCardNumber,
      aadhaarNumber,
      experience,
      qualification,
      resume,
    });
    await jobApplication.save();
    res.status(200).json({ message: 'Job application submitted successfully' });
  })} catch (error) {
    res.status(500).json({ message: 'Error submitting job application', error });

  }
};*/}


export const applyJob = async (req, res) => {
  const { jobApplicationDetails } = req.body;
  const parsedDetails = JSON.parse(jobApplicationDetails);
  try {
    //const { voterCardNumber, aadhaarNumber, experience, qualification } = req.body;
    const { username,experience, qualification } = parsedDetails;
    const file = req.file;
    //const userId = req.user.id
    console.log("req.body:", req);
console.log("req.file:", req.file);

 // Verify if username exists in the database
 const existingUser = await User.findOne({ username });
 if (!existingUser) {
   return res.status(400).json({ success: false, message: 'Invalid username. Please sign up.' });
 }


    // Validate the presence of required fields
{/*if (!userId || !voterCardNumber || !aadhaarNumber || !experience || !qualification) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }*/}
  
    // Handle file upload
    let resumeUrl = null;
    if (file) {
      try {
        const uploadResult = await cloudinaryInstance.uploader.upload(file.path, {
          folder: 'job_applications',
          resource_type: "raw",
          access_mode: "public"
          //public_id: "job_applications/resume" // Optional: Specify a folder in Cloudinary
        });
        resumeUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ success: false, message: 'Resume upload failed' });
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
    res.status(200).json({ success: true, message: 'Job application submitted successfully' });
  } catch (error) {
    console.error('Error submitting job application:', error);
    res.status(500).json({ success: false, message: 'Error submitting job application', error });
  }
};
 


// Login Controller
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
console.log(req.body)
    // Check if the user exists
    const user = await User.findOne({username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    {/*if (user.isFirstLogin) {
      user.walletAmount = 100; // Set wallet to 100 for the first login
      user.isFirstLogin = false; // Mark as not the first login
  }*/}

  await user.save();
 
    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate a JWT (optional, for session management)
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    }); 

    // Send login notification
    if (user.email) {
      await sendNotificationEmail(user.email, "Login Alert", `Hi, you logged in successfully at ${new Date()}.`);
    }

    // Send success response
    res.status(200).json({
      message: "Login successful",
      user: { id: user._id, username: user.username, profilePic: user.profilePic, walletAmount: user.walletAmount },
     token // Send the token if you're using JWT
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// profile pic

export const addProfilePic= async (req, res) => {
  const  userId  = req.user.id;
  const file = req.file 
  if (!file) {
    return res.status(400).json({ success: false, message: 'No file provided' });
  }

  try {

    // Handle file upload
    let profilePicUrl = null;
    if (file) {
      try {
        const uploadResult = await cloudinaryInstance.uploader.upload(file.path, {
          folder: 'profilePics',
         // resource_type: "raw",
          access_mode: "public"
          //public_id: "job_applications/resume" // Optional: Specify a folder in Cloudinary
        });
        profilePicUrl = uploadResult.secure_url;
        if (!profilePicUrl) {
          throw new Error('Failed to upload to Cloudinary');
        }
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ success: false, message: 'Profilepic upload failed' });
      }
    }
      const user = await User.findByIdAndUpdate(
          userId,
          { profilePic: profilePicUrl },
          { new: true }
      );

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      res.status(200).json({ message: 'Profile picture updated', user,profilePic: profilePicUrl});
  } catch (err) {
    console.error("profile pic", err);
      res.status(500).json({ error: 'Server error', details: err.message });
  }} 
  

  // get user profile
export const getProfile = async (req, res) => {
  try {

    const user = await User.findById(req.user.id).select('-password'); 
console.log(user)
    if (!user) {
      return res.status(404).send('User not found');
    }

    res.status(200).json({
     username: user.username, profilePic: user.profilePic, email:user.email,coverPic:user.coverPic
     
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
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
    const userPosts = await Post.find({ userId }).sort({ createdAt: -1 }).populate({
      path: 'comments.userId',
      select: 'username profilePic', // Fetch only required fields
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
    res.status(500).json({ success: false, message: "Failed to fetch user posts", error });
  }
};

// Log out
 export const logout= async (req, res) => {
  res.status(200).json({ message: "User logged out successfully." });
 }
 

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
 
         res.status(200).json({ message: "Wallet initialized", walletAmount: user.walletAmount });
     } catch (error) {
         res.status(500).json({ message: "Error initializing wallet", error });
     }
 };

 // user matrics
 export const getUserMetrics = async (req, res) => {
  try {
      const userId = req.user.id;

      // Fetch posts by the user
      const posts = await Post.find({ userId });

      // Calculate likes, dislikes, and post count
      const totalLikesOnPosts = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
      const totalDislikesOnPosts = posts.reduce((sum, post) => sum + (post.dislikes || 0), 0);
      
      
      
      const postCount = posts.length;

      // Update wallet amount
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });



        // Handle first login to add an initial wallet amount of 100
        if (user.walletAmount === 0 && user.isFirstLogin) {
          user.walletAmount = 100; // Add initial wallet amount
          user.isFirstLogin = false; // Mark that the initial login setup is complete
      }
      // Calculate the total wallet amount based on reactions
      const calculatedWalletAmount = (totalLikesOnPosts + totalDislikesOnPosts) * 10;

      // Update walletAmount ONLY if it differs from the calculated amount
      if (user.walletAmount !== 100 && user.walletAmount !== calculatedWalletAmount) {
          user.walletAmount += calculatedWalletAmount;
         
      }


      // Calculate total likes and dislikes made by the user on other posts
      const totalLikes = user.reactions.filter(reaction => reaction.reactionType === 'like').length;
      const totalDislikes = user.reactions.filter(reaction => reaction.reactionType === 'dislike').length;


      //user.walletAmount += (totalLikes + totalDislikes) * 10;
      await user.save();

      //const walletAmount = (totalLikes + totalDislikes) * 10;


      res.status(200).json({
          postCount,
          totalLikes,
          totalDislikes,
          walletAmount: user.walletAmount,
        
      });
  } catch (error) {
      res.status(500).json({ message: "Error fetching metrics", error });
  }
};
 

// generate OTP
// Temporary store for OTPs (use Redis/DB in production)
let otpStore = {}; 

export const sendOTP= async (req, res) => {
  const { email } = req.body;
 
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
}
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  //const otpExpiration = Date.now() + 10 * 60 * 1000; // Valid for 10 minutes
  // Store OTP with expiration
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // 5 minutes
  console.log("Generated OTP:", otp); 

  try {
      await sendOtpEmail(email, otp);
      res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
      res.status(500).json({ message: "Failed to send OTP", error });
  }
}


// verify OTP

export const verifyOTP= (req, res) => {
  console.log("Request Body:", req.body); 
  const { email, otp } = req.body;
   // Check if email and otp are provided
   if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required." });
}

  if (!otpStore[email]) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  const { otp: storedOtp, expiresAt } = otpStore[email];

  if (Date.now() > expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ message: "OTP expired" });
  }

  if (storedOtp === otp) {
      delete otpStore[email];
      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
      return res.status(200).json({ message: "OTP verified", token });
  }

  res.status(400).json({ message: "Invalid OTP" });
}

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
      const resetToken = crypto.randomBytes(32).toString('hex'); // Random string
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

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
          service: 'Gmail',
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
          subject: 'Reset Your Password',
          html: `
          <p>To reset your password, click on the following link:</p>
          <a href="${resetUrl}" target="_blank">Reset Password</a>
      `,
      };

      // Sending the email
      await transporter.sendMail(mailOptions);

      // Return success message
      res.status(200).json({ message: 'Password reset link sent to your email.' });

  } catch (error) {
      console.error('Error sending reset email:', error);
      res.status(500).json({ message: 'Server error, please try again later.' });
  }
}

// Reset password
{/*export const resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;
  console.log(req.body);
  if (!resetToken || !newPassword) {
    return res.status(400).json({ message: "Missing required fields" });
}

  try {
      // Find user with the reset token
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const user = await User.findOne({
          resetPasswordToken: hashedToken,
          resetPasswordExpire: { $gt: Date.now() }, // Check if token has expired
      });

      if (!user) {
          return res.status(400).json({ message: "Invalid or expired token" });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update the password and clear reset token
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Server error, please try again later." });
  }
};*/}

export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    console.log(req.body);
    // Validate input fields
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: "Invalid request. Missing fields." });
    }

    // Hash the token received in the request
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    console.log("hash token", hashedToken);
    // Find the user with the provided token and check if it is still valid
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiration: { $gt: Date.now() }, // Token must be valid and not expired
    });
    console.log("user", user);
    // If no user found, return error
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token." });
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
      success: true
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};



// search users

export const userSearch= async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const users = await User.find({ 
      username: { $regex: query, $options: 'i' } // Case-insensitive search
    }).select('username profilePic'); // Return only required fields

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// get posts of searched user

export const getSearchedUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const posts = await Post.find({  userId }).populate('userId', 'username profilePic').sort({ createdAt: -1 }); // Adjust sorting if needed
   
    const user = await User.findById(userId).select("username profilePic");
    if (!posts.length) {
      return res.status(200).json({ success: true, data: [],user}); // No posts found
    } 
   
   
   
    res.status(200).json({ success: true, data: posts ,user});
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// cover pic

export const addCoverPic= async (req, res) => {
  const  userId  = req.user.id;
  const file = req.file 
  if (!file) {
    return res.status(400).json({ success: false, message: 'No file provided' });
  }

  try {

    // Handle file upload
    let coverPicUrl = null;
    if (file) {
      try {
        const uploadResult = await cloudinaryInstance.uploader.upload(file.path, {
          folder: 'coverPics',
         // resource_type: "raw",
          access_mode: "public"
          //public_id: "job_applications/resume" // Optional: Specify a folder in Cloudinary
        });
        coverPicUrl = uploadResult.secure_url;
        if (!coverPicUrl) {
          throw new Error('Failed to upload to Cloudinary');
        }
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ success: false, message: 'Coverpic upload failed' });
      }
    }
      const user = await User.findByIdAndUpdate(
          userId,
          { coverPic: coverPicUrl },
          { new: true }
      );

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      res.status(200).json({ message: 'Cover picture updated', user,coverPic: coverPicUrl});
  } catch (err) {
    console.error("profile pic", err);
      res.status(500).json({ error: 'Server error', details: err.message });
  }} 
  

  // send mobile otp

  const normalizePhoneNumber = (phoneNumber) => {
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
  return phoneNumber.startsWith('91') ? `+${phoneNumber}` : `+91${phoneNumber}`;
  };

  export const sendMobileOtp= (req, res) => {
    console.log('Request body:', req.body); // Debugging log
    let { phoneNumber } = req.body;
    phoneNumber = normalizePhoneNumber(phoneNumber);
    if (!phoneNumber) return res.status(400).json({ error: 'Phone number is required' });
  

    // Ensure it's in E.164 format for Twilio
    const formattedPhoneNumber = `+91${phoneNumber}`;
    console.log("Sending OTP to:", formattedPhoneNumber);
  


    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpMap.set(phoneNumber, otp);
    console.log(`Generated OTP for ${phoneNumber}: ${otp}`);
  
    client.messages
      .create({
        body: `Your OTP is ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      })
      .then(() => res.json({ message: 'OTP sent successfully' }))
      .catch(err => res.status(500).json({ error: err.message }));
  };
 
// verify mobile otp

export const verifyMobileOtp= (req, res) => {
  let { phoneNumber, otp } = req.body;
  phoneNumber = normalizePhoneNumber(phoneNumber);
  console.log("verify req",req.body)
  if (!phoneNumber || !otp) {
    return res.status(400).json({ error: 'Phone number and OTP are required' });
  }

  const storedOtp = otpMap.get(phoneNumber);
  console.log(`Stored OTP for ${phoneNumber}: ${storedOtp}`);


  if (storedOtp && storedOtp === otp) {
    otpMap.delete(phoneNumber);
    return res.json({ message: 'OTP verified successfully' });
  }

  res.status(400).json({ error: 'Invalid OTP' });
};

// Deactivate account

export const deactivateUserAccount = async (req, res) => {
  const userId = req.user.id;
console.log("deactivate",userId)
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false, deactivatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }        

    res.status(200).json({ message: 'User account deactivated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating user account', error });
  }
};



export default signup;   
