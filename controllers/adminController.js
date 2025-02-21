import Post from "../Model/postModel.js";
import Admin from "../Model/adminModel.js"
import bcrypt from "bcrypt";
import { sendSMS } from "../utils/sendSMS.js";
import translate from '@vitalets/google-translate-api'
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
        if (updatedPost.userId && updatedPost.userId.email) {
            const userName = updatedPost.userId.username; // Fetch username
            const userEmail = updatedPost.userId.email; // Fetch user email
            
            if (status === "approved") {
                // Email for approved post
                const subject = "Your Post is Live – Let the World Hear Your Voice! 🌍✨";
                const message = `Hi ${userName},

🎉 Great news! Your post is now live on Magnifier and ready to inspire, engage, and spark conversations! 

Your voice is now part of a vibrant community of thinkers, creators, and changemakers. Here’s how you can make the most of it:
- Share your post with friends and followers to spread the word.
- Engage with comments – your insights matter!
- Stay active – keep sharing bold ideas and inspiring others.

Thank you for being a part of Magnifier. Together, we’re building a platform where every voice matters! 🚀

Keep shining,  
The Magnifier Team

विषय: आपकी पोस्ट लाइव है – दुनिया को आपकी आवाज़ सुनने दें! 🌍✨

नमस्ते ${translatedUsername},

🎉 बड़ी खुशखबरी! आपकी पोस्ट अब मैग्निफायर पर लाइव है और लोगों को प्रेरित करने, जोड़ने और बातचीत शुरू करने के लिए तैयार है! 

आपकी आवाज़ अब विचारशील, रचनात्मक और बदलाव लाने वाले लोगों के एक जीवंत समुदाय का हिस्सा है। इसे और बेहतर बनाने के लिए आप यह कर सकते हैं:
- अपनी पोस्ट को दोस्तों और फॉलोअर्स के साथ शेयर करें ताकि यह और लोगों तक पहुंचे।
- कमेंट्स में शामिल हों – आपके विचार महत्वपूर्ण हैं!
- सक्रिय रहें – अपने साहसिक विचारों को साझा करते रहें और दूसरों को प्रेरित करें।

मैग्निफायर का हिस्सा बनने के लिए धन्यवाद। हम मिलकर एक ऐसा मंच बना रहे हैं जहां हर आवाज़ मायने रखती है! 🚀

चमकते रहें,  
मैग्निफायर टीम`;

                await sendNotificationEmail(userEmail, subject, message);
            } else if (status === "rejected") {
                // Email for rejected post
                const subject = "Let’s Refine Your Post – You’re Almost There! 🚀";
                const message = `Hi ${userName},

Thank you for sharing your thoughts on Magnifier! After careful review, we noticed that your post doesn’t fully align with our community guidelines. But don’t worry – this is just a small bump on the road to making your voice heard!

📌 Here’s what you can do next:
1. Review our Community Guidelines [Insert Link] to understand what we look for in posts.
2. Make the necessary edits to your post to ensure it’s meaningful, respectful, and engaging.
3. Repost your updated content – we can’t wait to see it!

Remember, every great idea deserves a second chance. Your voice matters, and we’re here to help you shine! ✨ 

Let’s work together to make your next post a success. We’re rooting for you!

Warm regards,  
The Magnifier Team

विषय: आइए आपकी पोस्ट को और बेहतर बनाएं – आप लगभग पहुंच गए हैं! 🚀

नमस्ते ${translatedUsername},

मैग्निफायर पर अपने विचार साझा करने के लिए धन्यवाद! सावधानीपूर्वक समीक्षा के बाद, हमने देखा कि आपकी पोस्ट हमारे कम्युनिटी दिशानिर्देशों के साथ पूरी तरह से मेल नहीं खाती है। लेकिन चिंता न करें – यह आपकी आवाज़ को सुनाने के रास्ते में एक छोटी सी बाधा है!  

📌 आगे क्या करें:
1. हमारे कम्युनिटी दिशानिर्देश [लिंक डालें] को पढ़ें ताकि आप समझ सकें कि हम पोस्ट में क्या देखते हैं।
2. अपनी पोस्ट में आवश्यक संशोधन करें ताकि यह सार्थक, सम्मानजनक और आकर्षक बन सके।
3. अपनी अपडेटेड पोस्ट को फिर से सबमिट करें – हम इसे देखने के लिए उत्सुक हैं!

याद रखें, हर महान विचार दूसरे मौके का हकदार है। आपकी आवाज़ मायने रखती है, और हम आपको चमकने में मदद करने के लिए यहां हैं! ✨

आइए मिलकर आपकी अगली पोस्ट को सफल बनाएं। हम आपके साथ हैं!  

सादर,  
मैग्निफायर टीम`;

                await sendNotificationEmail(userEmail, subject, message);
            }
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
  res.status(200).json({ message: "User logged out successfully." });
 }
