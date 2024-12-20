import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../Model/userModel.js'; // Adjust the import path if necessary
import JobApplication from '../Model/jobApplicationModel.js';
import { cloudinaryInstance } from '../config/cloudinary.js';
import Post from '../Model/postModel.js';
import { sendOtpEmail } from '../config/nodeMailer.js';

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
      wardNumber, vidhanSabha,
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
    const userId = req.user.id
    console.log("req.body:", req);
console.log("req.file:", req.file);
console.log("req.user:", req.user);

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
      userId,
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
     username: user.username, profilePic: user.profilePic 
     
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
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
  }postCount
};
 

// generate OTP
// Temporary store for OTPs (use Redis/DB in production)
export const sendOTP= async (req, res) => {
  const { email } = req.body;
  let otpStore = {}; 
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
}
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

  // Store OTP with expiration
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // 5 minutes

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
  const { email, otp } = req.body;

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

export default signup;   
