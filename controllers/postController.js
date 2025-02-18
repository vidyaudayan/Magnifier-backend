import Post from '../Model/postModel.js';
import { cloudinaryInstance } from '../config/cloudinary.js';
import User from '../Model/userModel.js'
import { sendNotificationEmail } from '../config/notifications.js';
import translate from '@vitalets/google-translate-api'
import { sendSMS } from '../utils/sendSMS.js';
// create post new
export const createPost = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: User ID missing' });
    }

    const file = req.file;
    const userId = req.user.id;
    const { postType, content } = req.body;
   // const user = await User.findOne({ username });
   
   // Fetch user by ID
   const user = await User.findById(userId);
   if (!user) {
     return res.status(404).json({ message: 'User not found' });
   }

   
   let mediaUrl = null;

    // Handle file upload
    if (file) {
      try {
        const uploadResult = await cloudinaryInstance.uploader.upload(file.path, {
          folder: 'posts',
          resource_type: 'auto',
        });
        mediaUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ success: false, message: 'Media upload failed' });
      }
    }

    // Ensure either content or mediaUrl is provided
    if (!content && !mediaUrl) {
      return res.status(400).json({ message: 'Content or media is required' });
    }


    // Convert username to Hindi using Google Translate API
    let translatedUsername;
    try {
      const translation = await translate(user.username, { to: "hi" });
      translatedUsername = translation.text;
    } catch (error) {
      console.error('Translation error:', error);
      translatedUsername = user.username; // Fallback to original username if translation fails
    }
    // Create a new post object
    const newPost = new Post({
      userId,
      postType,
      //content: postType === 'Text' ? content : '', // Store content for text posts
      //mediaUrl: postType !== 'Text' ? mediaUrl : '', // Store mediaUrl for non-text posts
      content: content || '',
  mediaUrl: mediaUrl || '', 
      
      status: 'pending',
    });

    // Save to database and populate fields
    const savedPost = await newPost.save();
    const populatedPost = await Post.findById(savedPost._id).populate('userId', 'username profilePic');

// Send post create notification
if (user.email) {
  await sendNotificationEmail(user.email, "Your Voice Matters - Thank You for Sharing! 🌟", `Hi ${user.username},
✨ Thank you for posting on Magnifier! ✨
Your thoughts are now in the spotlight! 🎯 Our advanced AI models and expert team are reviewing your post to ensure it’s polished, meaningful, and ready to shine.
📌 Here’s what’s next:

Your post will be live in 20-25 minutes after approval.

Once live, your voice will reach thousands of like-minded individuals ready to engage and inspire!
We’re thrilled to have you as part of our community. Keep sharing your bold ideas and sparking conversations that matter! 🚀
Stay tuned – your post is about to make waves! 🌊
Warm regards, 
The Magnifier Team

विषय: आपकी आवाज़ महत्वपूर्ि है – शेयर करने के ग्नलए धन्यवाद! 🌟
नमस्ते **${translatedUsername}**,
✨ मैविफायर पर पोस्ट करिे के विए धन्यिाद! ✨
आपके ग्नवचार अब स्पॉटलाइट में हैं! 🎯 हमारे उन्नत AI मॉडल और ग्नवशेषज्ञ टीम आपकी पोस्ट को सही, सार्िक और चमकने के ग्नलए तैयार करने के ग्नलए जांच कर रहे हैं।
📌 आगे क्या होगा:

आपकी पोस्ट को मंजूरी ग्नमलने के बाद 20-25 वमिट में लाइव कर ग्नदया जाएगा।

एक बार लाइव होने के बाद, आपकी आवाज़ हजारों ग्नवचारशील लोगों तक पहंचेगी, जो आपसे जुड़ने और प्रेररत होने के ग्नलए तैयार हैं!
आपको हमारे समुदाय का ग्नहस्सा बनकर बहत खुशी हो रही है। अपने साहग्नसक ग्नवचारों को साझा करते रहें और ऐसी बातचीत शुरू करें जो मायने रखती हो! 🚀
तैयार रहें – आपकी पोस्ट चचाि का ग्नवषय बनने वाली है! 🌊
सादर, 
मैविफायर टीम`);
}

// Send post created SMS
if (user.phoneNumber) {
  await sendSMS(user.phoneNumber,  `Thank you ${user.username}, for posting on Magnifier`);
}


    res.status(201).json({
      data: populatedPost,
      message: 'Post created successfully',
      success: true,
      error: false,
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Error creating post', error });
  }
};


// Fetch posts
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).populate('userId', 'username profilePic')
    .populate('userId', 'username profilePic')
    .populate('comments.userId', 'username')
    .populate('comments.userId', 'username profilePic'); 
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts', error });
  }
};

// Like a post new
{/*export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    //post.likes += 1;
    post.likes = (post.likes || 0) + 1; // Ensure likes is initialized
    await post.save();

    // Update wallet amount
  const user = await User.findById(post.userId);
    if (user) {
        user.walletAmount += 10;
        user.reactions.push({ postId, reactionType });
        await user.save();
    }

    res.status(200).json({ post, walletAmount: user.walletAmount });
  } catch (error) {
    res.status(500).json({ message: 'Error liking post', error });
  }
};*/}

// Like a post
{/*export const likePost = async (req, res) => {
  try {
      const { postId } = req.params;
      const userId = req.user.id; // Get the logged-in user's ID from the request body

      // Fetch the post
      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ message: 'Post not found' });

      // Fetch the user
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Check if the user already liked the post
      const alreadyLiked = user.reactions.some(reaction => reaction.postId === postId && reaction.reactionType === 'like');
      if (alreadyLiked) {
          return res.status(400).json({ message: 'You already liked this post' });
      }

      // Increment likes
      post.likes = (post.likes || 0) + 1;
      await post.save();

      // Update the wallet amount and record the reaction
      user.walletAmount += 10;
      user.reactions.push({ postId, reactionType: 'like' });
      await user.save();

      res.status(200).json({ post, walletAmount: user.walletAmount });
  } catch (error) {
      console.error('Error liking post:', error);
      res.status(500).json({ message: 'Error liking post', error });
  }
}*/}

// Dislike a post
{/*export const dislikePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

   
    post.dislikes = (post.dislikes || 0) + 1; 
    await post.save();

    // Update wallet amount
    const user = await User.findById(post.userId);
    if (user) {
        user.walletAmount += 10;
        user.reactions.push({ postId, reactionType });
        await user.save();
    }

    res.status(200).json({ post, walletAmount: user.walletAmount });
  } catch (error) {
    res.status(500).json({ message: 'Error disliking post', error });
  }
};*/}

// Dislike a post new
{/*export const dislikePost = async (req, res) => {
  try {
      const { postId } = req.params;
      const userId = req.user.id; // Get the logged-in user's ID from the request body

      // Fetch the post
      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ message: 'Post not found' });

      // Fetch the user
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Check if the user already disliked the post
      const alreadyDisliked = user.reactions.some(reaction => reaction.postId === postId && reaction.reactionType === 'dislike');
      if (alreadyDisliked) {
          return res.status(400).json({ message: 'You already disliked this post' });
      }

      // Increment dislikes
      post.dislikes = (post.dislikes || 0) + 1;
      await post.save();

      // Update the wallet amount and record the reaction
      user.walletAmount += 10;
      user.reactions.push({ postId, reactionType: 'dislike' });
      await user.save();

      res.status(200).json({ post, walletAmount: user.walletAmount });
  } catch (error) {
      console.error('Error disliking post:', error);
      res.status(500).json({ message: 'Error disliking post', error });
  }
};*/}


// Add a comment
{/*export const addComment = async (req, res) => {
  
  
  try {
    const userId = req.user.id
    const { postId } = req.params;
    const {  comment } = req.body;

    console.log("Received postId:", postId);
    console.log("Received userId:", userId);
    console.log("Received comment:", comment);

    if (!comment || typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({ message: "Invalid comment data" });
  }  

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ userId, comment });
    await post.save();    
    res.status(201).json(post);
  } catch (error) {
    console.error("Error in addComment controller:", error); 
    res.status(500).json({ message: 'Error adding comment', error });
  }
};*/}


export const addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const { comment } = req.body;

    if (!comment || typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({ message: "Invalid comment data" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Add comment to the post
    post.comments.push({ userId, comment });
    await post.save();

    // Fetch the updated post with populated user data
    const updatedPost = await Post.findById(postId)
      .populate('userId', 'username profilePic') // Populate post author
      .populate('comments.userId', 'username profilePic'); // Populate comment authors

    res.status(201).json(updatedPost); // Send the fully populated post
  } catch (error) {
    console.error("Error in addComment controller:", error);
    res.status(500).json({ message: 'Error adding comment', error });
  }
};






export const updateReactions = async (req, res) => {
  try {
      const { postId } = req.params;
      const { reaction } = req.body; // 'like' or 'dislike'

      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ message: "Post not found" });

      if (reaction === 'like') {
          post.likes += 1;
      } else if (reaction === 'dislike') {
          post.dislikes += 1;
      } else {
          return res.status(400).json({ message: "Invalid reaction type" });
      }

      await post.save();

      // Update wallet amount
      const user = await User.findById(post.userId);
      if (user) {
          user.walletAmount += 10;
          await user.save();
      }

      res.status(200).json({ message: "Reaction updated", post });
  } catch (error) {
      res.status(500).json({ message: "Error updating reactions", error });
  }
};

// like post new 1
{/*export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id; // Get the logged-in user's ID

    // Fetch the post
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Fetch the user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if the user already reacted to this post
    const existingReactionIndex = user.reactions.findIndex(
      (reaction) => reaction.postId.toString() === postId
    );

    if (existingReactionIndex !== -1) {
      const existingReaction = user.reactions[existingReactionIndex];
      if (existingReaction.reactionType === 'like') {
        return res.status(400).json({ message: 'You already liked this post' });
      }

      // If the existing reaction is 'dislike', remove it
      if (existingReaction.reactionType === 'dislike') {
        post.dislikes = Math.max((post.dislikes || 0) - 1, 0);
        user.reactions.splice(existingReactionIndex, 1); // Remove the reaction
      }
    }

    // Increment likes and save the new reaction
    post.likes = (post.likes || 0) + 1;
    await post.save();

    user.walletAmount += 10; // Reward for reacting
    user.reactions.push({ postId, reactionType: 'like' });
    await user.save();

    res.status(200).json({ post, walletAmount: user.walletAmount });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Error liking post', error });
  }
};


export const dislikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id; // Get the logged-in user's ID

    // Fetch the post
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Fetch the user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if the user already reacted to this post
    const existingReactionIndex = user.reactions.findIndex(
      (reaction) => reaction.postId.toString() === postId
    );

    if (existingReactionIndex !== -1) {
      const existingReaction = user.reactions[existingReactionIndex];
      if (existingReaction.reactionType === 'dislike') {
        return res.status(400).json({ message: 'You already disliked this post' });
      }

      // If the existing reaction is 'like', remove it
      if (existingReaction.reactionType === 'like') {
        post.likes = Math.max((post.likes || 0) - 1, 0);
        user.reactions.splice(existingReactionIndex, 1); // Remove the reaction
      }
    }

    // Increment dislikes and save the new reaction
    post.dislikes = (post.dislikes || 0) + 1;
    await post.save();

    user.walletAmount += 10; // Reward for reacting
    user.reactions.push({ postId, reactionType: 'dislike' });
    await user.save();

    res.status(200).json({ post, walletAmount: user.walletAmount });
  } catch (error) {
    console.error('Error disliking post:', error);
    res.status(500).json({ message: 'Error disliking post', error });
  }
};*/}

export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Fetch the post
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

 // Prevent user from liking their own post
 if (post.userId.toString() === userId) {
  return res
    .status(400)
    .json({ message: "You cannot like your own post" });
}


    // Fetch the user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check for an existing reaction
    const existingReactionIndex = user.reactions.findIndex(
      (reaction) => reaction.postId.toString() === postId
    );

    let walletIncremented = false;

    if (existingReactionIndex >= 0) {
      // If user already reacted to the post
      const existingReaction = user.reactions[existingReactionIndex];

      if (existingReaction.reactionType === "dislike") {
        // If changing from dislike to like, update reactionType but do not increment wallet
        existingReaction.reactionType = "like";
        post.dislikes = Math.max(0, post.dislikes - 1); // Decrease dislikes
        post.likes += 1; // Increase likes
      } else {
        // Already liked; no action needed
        return res.status(400).json({ message: "You already liked this post" });
      }
    } else {
      // First time reacting to the post
      user.reactions.push({ postId, reactionType: "like" });
      post.likes += 1; // Increment likes
      user.walletAmount += 10; // Increment wallet
      walletIncremented = true;
    }

    // Save the changes
    await post.save();
    await user.save();

    // Send email notification to the post owner
    const postOwnerEmail = post.userId.email; // Assuming email is stored in the user model
    if (postOwnerEmail) {
      await sendNotificationEmail(
        postOwnerEmail,
        "New Like on Your Post",
        `Hi ${post.userId.username}, your post has received a new like from ${user.username}.`
      );
    }

    res.status(200).json({
      message: walletIncremented
        ? "Post liked, wallet updated"
        : "Post liked, wallet not updated",
      post,
      walletAmount: user.walletAmount,
      //totalLikes: post.likes,
  //totalDislikes: post.dislikes,

    });
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({ message: "Error liking post", error });
  }
};



export const dislikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Fetch the post
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

 // Prevent user from liking their own post
 if (post.userId.toString() === userId) {
  return res
    .status(400)
    .json({ message: "You cannot like your own post" });
}




    // Fetch the user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check for an existing reaction
    const existingReactionIndex = user.reactions.findIndex(
      (reaction) => reaction.postId.toString() === postId
    );

    let walletIncremented = false;

    if (existingReactionIndex >= 0) {
      // If user already reacted to the post
      const existingReaction = user.reactions[existingReactionIndex];

      if (existingReaction.reactionType === "like") {
        // If changing from like to dislike, update reactionType but do not increment wallet
        existingReaction.reactionType = "dislike";
        post.likes = Math.max(0, post.likes - 1); // Decrease likes
        post.dislikes += 1; // Increase dislikes
      } else {
        // Already disliked; no action needed
        return res.status(400).json({ message: "You already disliked this post" });
      }
    } else {
      // First time reacting to the post
      user.reactions.push({ postId, reactionType: "dislike" });
      post.dislikes += 1; // Increment dislikes
      user.walletAmount += 10; // Increment wallet
      walletIncremented = true;
    }

    // Save the changes
    await post.save();
    await user.save();

    // Send email notification to the post owner
    {/*const postOwnerEmail = post.userId.email; // Assuming email is stored in the user model
    if (postOwnerEmail) {
      await sendNotificationEmail(
        postOwnerEmail,
        "New Dislike on Your Post",
        `Hi ${post.userId.username}, your post has received a new dislike from ${user.username}.`
      );
    }*/}

    res.status(200).json({
      message: walletIncremented
        ? "Post disliked, wallet updated"
        : "Post disliked, wallet not updated",
      post,
      walletAmount: user.walletAmount,
      totalLikes: post.likes,
  totalDislikes: post.dislikes,

    });
  } catch (error) {
    console.error("Error disliking post:", error);
    res.status(500).json({ message: "Error disliking post", error });
  }
};


// new post owner 
export const likePosts = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Fetch the post
    const post = await Post.findById(postId).populate('userId', 'username profilePic email');;
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Prevent user from liking their own post
    if (post.userId.toString() === userId) {
      return res.status(400).json({ message: "You cannot like your own post" });
    }

    // Fetch the user who liked the post
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch the post owner
    const postOwner = await User.findById(post.userId);
    if (!postOwner) return res.status(404).json({ message: "Post owner not found" });

    // Check for an existing reaction
    const existingReactionIndex = user.reactions.findIndex(
      (reaction) => reaction.postId.toString() === postId
    );

    let walletIncremented = false;

    if (existingReactionIndex >= 0) {
      // If user already reacted to the post
      const existingReaction = user.reactions[existingReactionIndex];

      if (existingReaction.reactionType === "dislike") {
        // If changing from dislike to like, update reactionType and update counts
        existingReaction.reactionType = "like";
        post.dislikes = Math.max(0, post.dislikes - 1); // Decrease dislikes
        post.likes += 1; // Increase likes
      } else {
        // Already liked; no action needed
        return res.status(400).json({ message: "You already liked this post" });
      }
    } else {
      // First time reacting to the post
      user.reactions.push({ postId, reactionType: "like" });
      post.likes += 1; // Increment likes

      // Increment wallet balance of post owner
      postOwner.walletAmount += 10;
      walletIncremented = true;
    }

    // Save the changes
    await post.save();
    await user.save();
    await postOwner.save();
    // Send email notification to the post owner
    {/*const postOwnerEmail = post.userId.email; // Assuming email is stored in the user model
    if (postOwnerEmail) {
      await sendNotificationEmail(
        postOwnerEmail,
        "New Like on Your Post",
        `Hi ${post.userId.username}, your post has received a new like from ${user.username}.`
      );
    }*/}

    res.status(200).json({
      message: walletIncremented
        ? "Post liked, post owner's wallet updated"
        : "Post liked, wallet not updated",
      post,
      walletAmount: user.walletAmount,
    });
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({ message: "Error liking post", error });
  }
};


export const dislikePosts = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Fetch the post
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Prevent user from disliking their own post
    if (post.userId.toString() === userId) {
      return res.status(400).json({ message: "You cannot dislike your own post" });
    }

    // Fetch the user who disliked the post
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch the post owner
    const postOwner = await User.findById(post.userId);
    if (!postOwner) return res.status(404).json({ message: "Post owner not found" });

    // Check for an existing reaction
    const existingReactionIndex = user.reactions.findIndex(
      (reaction) => reaction.postId.toString() === postId
    );

    let walletIncremented = false;

    if (existingReactionIndex >= 0) {
      // If user already reacted to the post
      const existingReaction = user.reactions[existingReactionIndex];

      if (existingReaction.reactionType === "like") {
        // If changing from like to dislike, update reactionType and update counts
        existingReaction.reactionType = "dislike";
        post.likes = Math.max(0, post.likes - 1); // Decrease likes
        post.dislikes += 1; // Increase dislikes
      } else {
        // Already disliked; no action needed
        return res.status(400).json({ message: "You already disliked this post" });
      }
    } else {
      // First time reacting to the post
      user.reactions.push({ postId, reactionType: "dislike" });
      post.dislikes += 1; // Increment dislikes

      // Increment wallet balance of post owner
      postOwner.walletAmount += 10;
      walletIncremented = true;
    }

    // Save the changes
    await post.save();
    await user.save();
    await postOwner.save();

    // Send email notification to the post owner
    {/*const postOwnerEmail = post.userId.email; // Assuming email is stored in the user model
    if (postOwnerEmail) {
      await sendNotificationEmail(
        postOwnerEmail,
        "New Like on Your Post",
        `Hi ${post.userId.username}, your post has received a new like from ${user.username}.`
      );
    }*/}

    res.status(200).json({
      message: walletIncremented
        ? "Post disliked, post owner's wallet updated"
        : "Post disliked, wallet not updated",
      post,
      walletAmount: user.walletAmount,
    });
  } catch (error) {
    console.error("Error disliking post:", error);
    res.status(500).json({ message: "Error disliking post", error });
  }
}; 


export const getPostById = async (req, res) => {
  try {
    const { id } = req.params; // Get the post ID from the request parameters
    console.log("postbyId",id)
    // Fetch the post from the database
    //const post = await Post.findOne({ _id: id });

    // Validate ObjectId
    {/*if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid post ID format" });
    }*/}

    // Fetch the post from DB
    const post = await Post.findById(id);


    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Return the post data
    res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// delete post 

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

// Check if the authenticated user is the post owner
if (post.userId.toString() !== req.user.id) {
  return res.status(403).json({ message: 'You do not have permission to delete this post' });
}


    // Perform deletion
    await post.deleteOne();

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
