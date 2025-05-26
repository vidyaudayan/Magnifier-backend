import Post from "../Model/postModel.js";
import { cloudinaryInstance } from "../config/cloudinary.js";
import User from "../Model/userModel.js";
import { sendNotificationEmail } from "../config/notifications.js";
import translate from "@vitalets/google-translate-api";
import { sendSMS } from "../utils/sendSMS.js";
import getPostCreationEmailTemplate from "../templates/createPostMessage.js";
import { uploadToS3 } from "../utils/s3Uploader.js";
import mongoose from "mongoose";


// amazon s3

export const createPost = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    const { file } = req;
    const { postType, content, stickyDuration, timezone } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId).select('+state +vidhanSabha');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

     // Validate user has location data if required
     if (!user.state || !user.vidhanSabha) {
      return res.status(400).json({ 
        message: "User location data is incomplete. Please update your profile."
      });
    }

    let mediaUrl = null;

    // Handle file upload
    if (file) {
      try {
        
        if (!file.buffer || file.buffer.length === 0) {
          throw new Error("File buffer is empty");
        }
        let folder = "images";
        if (file.mimetype.startsWith("audio/")) {
          folder = "audios";
        }

        const uploadResult = await uploadToS3(file,folder);
        mediaUrl = uploadResult.url;
      } catch (uploadError) {
        console.error("Upload error:", uploadError);
        return res.status(400).json({
          success: false,
          message: uploadError.message || "File upload failed",
          details:
            process.env.NODE_ENV === "development"
              ? uploadError.stack
              : undefined,
        });
      }
    }

    // Validate at least content or media exists
    if (!content && !mediaUrl) {
      return res
        .status(400)
        .json({ message: "Either content or media is required" });
    }

    // Create and save post
    const newPost = new Post({
      userId,
      postType,
      content: content || "",
      mediaUrl: mediaUrl || "",
      stickyDuration: stickyDuration
        ? parseInt(stickyDuration) / (60 * 60 * 1000)
        : 0,
      postStatus: "draft",
      status: "pending",
      timezone: timezone || "UTC",
      state: user.state,
      vidhanSabha: user.vidhanSabha
    });

    const savedPost = await newPost.save();
    const populatedPost = await Post.findById(savedPost._id).populate(
      "userId",
      "username profilePic"
    );

    // Send notifications 
    
    if (user.email) {
      await sendNotificationEmail(
        user.email,"Your Voice Matters – Thank You for Sharing! 🌟",null,
        getPostCreationEmailTemplate(user.username)
      );
    }
    
    
    // Send post created SMS
    if (user.phoneNumber) {
      console.log("Phone number create post:", user.phoneNumber);
      await sendSMS(user.phoneNumber,  `Thank you ${user.username}, for posting on Magnifier, The admin will review your post before publishing`);
    }
    

    return res.status(201).json({
      data: populatedPost,
      message: "Post created successfully",
      success: true,
    });
  } catch (error) {
    console.error("Create post error:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// create draft post new

export const createDraftPost = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    // Extract fields from FormData
    const { content, timezone } = req.body; // Now properly extracting content
    const file = req.file;
    const userId = req.user.id;

    let voiceNoteUrl = "";

    const user = await User.findById(userId).select('+state +vidhanSabha');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
     // Validate user has location data if required
     if (!user.state || !user.vidhanSabha) {
      return res.status(400).json({ 
        message: "User location data is incomplete. Please update your profile."
      });
    }


    let mediaUrl = null;

    // Handle file upload
    if (file) {
      try {
        const uploadResult = await uploadToS3(file, "images"); // "images" folder in S3
        mediaUrl = uploadResult.url;
      } catch (uploadError) {
        console.error("Error uploading to Amazon s3", uploadError);
        return res
          .status(500)
          .json({ success: false, message: "Media upload failed" });
      }
    }

    // Ensure either content or mediaUrl is provided
    if (!content && !mediaUrl) {
      return res.status(400).json({ message: "Content or media is required" });
    }

    let postType = "Text";
    if (mediaUrl) {
      // For single file uploads, use file.mimetype instead of req.files[0]
      postType = file.mimetype.startsWith("image") ? "Photo" : "Video";
    }
    if (voiceNoteUrl) postType = "VoiceNote";

    // Create a new post object
    const newPost = new Post({
      userId,
      postType,
      content: content || "",
      mediaUrl: mediaUrl || "",
      stickyDuration: 0,
      postStatus: "draft",
      status: "pending",
      sticky: false,
      stickyUntil: null,
      timezone: timezone || "UTC",
      state: user.state,
      vidhanSabha: user.vidhanSabha
    });

    const savedPost = await newPost.save();
    res.status(201).json({
      success: true,
      message: "Draft post created successfully",
      post: {
        _id: savedPost._id,
        content: savedPost.content,
        mediaUrl: savedPost.mediaUrl,
        postType: savedPost.postType,
        createdAt: savedPost.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating draft post:", error);
    res.status(500).json({
      success: false,
      message: "Error creating post",
      error: error.message,
    });
  }
};

// Fetch posts
{/*export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ sticky: -1, stickyUntil: -1, createdAt: -1 })
      
      .populate({
        path: "userId",
        select: "username profilePic", // Fetch only username & profilePic
      })
      .populate({
        path: "comments.userId",
        select: "_id  username profilePic", // Fetch only necessary fields for comments
      });
    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error });
  }
};*/}

{/*export const getPosts = async (req, res) => {
  try {
    const { filter,state, vidhanSabha } = req.query;
    const user = req.user.id; // Assuming you have user data from authentication
   console.log('user state', state);
console.log('user vidhanSabha', vidhanSabha);
    // Base query for approved posts
    //let query = { status: 'approved' };
     let query = { 
      status: 'approved',
      postStatus: 'published'
    };

    

    if (filter === 'personalized' && state) {
  query.state = state;
} else if (filter === 'local' && vidhanSabha) {
  query.vidhanSabha = vidhanSabha;
}
    // National tab - no additional filters

    const posts = await Post.find(query)
      .sort({ sticky: -1, stickyUntil: -1, createdAt: -1 })
      .populate({
        path: "userId",
        select: "username profilePic",
      })
      .populate({
        path: "comments.userId",
        select: "_id username profilePic",
      });

    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error });
  }
};*/}

export const getPosts = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    // Ensure user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Build query based on user's state
    const query = {
      status: 'approved',
      postStatus: 'published',
      state: user.state, // This is the main condition
    };

    // Fetch posts
    const posts = await Post.find(query)
      .sort({ sticky: -1, stickyUntil: -1, createdAt: -1 })
      .populate("userId", "username profilePic")
      .populate("comments.userId", "_id username profilePic");

    res.status(200).json({ posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts", error });
  }
};




export const addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const { comment } = req.body;

    if (!comment || typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({ message: "Invalid comment data" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Add comment to the post
    post.comments.push({ userId, comment });
    await post.save();

    // Fetch the updated post with populated user data
    const updatedPost = await Post.findById(postId)
      .populate("userId", "username profilePic") // Populate post author
      .populate("comments.userId", "username profilePic"); // Populate comment authors

    res.status(201).json(updatedPost); // Send the fully populated post
  } catch (error) {
    console.error("Error in addComment controller:", error);
    res.status(500).json({ message: "Error adding comment", error });
  }
};

export const updateReactions = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reaction } = req.body; // 'like' or 'dislike'

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (reaction === "like") {
      post.likes += 1;
    } else if (reaction === "dislike") {
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
{
  /*export const likePost = async (req, res) => {
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
};*/
}

export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Fetch the post
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Prevent user from liking their own post
    if (post.userId.toString() === userId) {
      return res.status(400).json({ message: "You cannot like your own post" });
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
      return res.status(400).json({ message: "You cannot like your own post" });
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
        return res
          .status(400)
          .json({ message: "You already disliked this post" });
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
    {
      /*const postOwnerEmail = post.userId.email; // Assuming email is stored in the user model
    if (postOwnerEmail) {
      await sendNotificationEmail(
        postOwnerEmail,
        "New Dislike on Your Post",
        `Hi ${post.userId.username}, your post has received a new dislike from ${user.username}.`
      );
    }*/
    }

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

    // Fetch the post and validate it
    const post = await Post.findById(postId).populate(
      "userId",
      "username profilePic email"
    );
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Prevent user from liking their own post
    if (!post.userId) {
      return res
        .status(400)
        .json({ message: "Post does not have a valid userId" });
    }

    if (post.userId._id.toString() === userId) {
      return res.status(400).json({ message: "You cannot like your own post" });
    }

    // Fetch user and post owner
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const postOwner = await User.findById(post.userId);
    if (!postOwner)
      return res.status(404).json({ message: "Post owner not found" });

    // Check if the user has already reacted
    const existingReactionIndex = user.reactions.findIndex(
      (reaction) => reaction.postId.toString() === postId
    );

    let walletIncremented = false;

    if (existingReactionIndex >= 0) {
      // If user has already reacted
      const existingReaction = user.reactions[existingReactionIndex];

      if (existingReaction.reactionType === "like") {
        // Remove like if the user clicks like again
        post.likes = Math.max(0, post.likes - 1);
        user.reactions.splice(existingReactionIndex, 1);
        postOwner.walletAmount = Math.max(0, postOwner.walletAmount - 10); // Deduct from wallet
        walletIncremented = true;
      } else if (existingReaction.reactionType === "dislike") {
        // Change from dislike to like
        existingReaction.reactionType = "like";
        post.dislikes = Math.max(0, post.dislikes - 1);
        post.likes += 1;
      }
    } else {
      // First-time like
      user.reactions.push({ postId, reactionType: "like" });
      post.likes += 1;
      postOwner.walletAmount += 10;
      walletIncremented = true;
    }

    // Save the changes
    await post.save();
    await user.save();
    await postOwner.save();

    res.status(200).json({
      message: walletIncremented
        ? "Post liked, post owner's wallet updated"
        : "Post liked or reaction updated",
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

    if (!post.userId) {
      return res
        .status(400)
        .json({ message: "Post does not have a valid userId" });
    }

    if (post.userId.toString() === userId) {
      return res
        .status(400)
        .json({ message: "You cannot dislike your own post" });
    }

    // Fetch the user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch the post owner
    const postOwner = await User.findById(post.userId);
    if (!postOwner)
      return res.status(404).json({ message: "Post owner not found" });

    // Check for an existing reaction
    const existingReactionIndex = user.reactions.findIndex(
      (reaction) => reaction.postId.toString() === postId
    );

    let walletUpdated = false;

    if (existingReactionIndex >= 0) {
      const existingReaction = user.reactions[existingReactionIndex];

      if (existingReaction.reactionType === "dislike") {
        // If user clicks dislike again, remove the dislike
        post.dislikes = Math.max(0, post.dislikes - 1);
        user.reactions.splice(existingReactionIndex, 1); // Remove reaction
      } else if (existingReaction.reactionType === "like") {
        // Change from like to dislike
        existingReaction.reactionType = "dislike";
        post.likes = Math.max(0, post.likes - 1);
        post.dislikes += 1;
      }
    } else {
      // First-time dislike
      user.reactions.push({ postId, reactionType: "dislike" });
      post.dislikes += 1;

      // Increment wallet balance of post owner
      postOwner.walletAmount += 10;
      walletUpdated = true;
    }

    // Save the changes
    await post.save();
    await user.save();
    await postOwner.save();

    res.status(200).json({
      message: walletUpdated
        ? "Post disliked, post owner's wallet updated"
        : "Post disliked",
      post,
      walletAmount: user.walletAmount,
    });
  } catch (error) {
    console.error("Error disliking post:", error);
    res.status(500).json({ message: "Error disliking post", error });
  }
};


// new share


export const getPostById = async (req, res) => {
  try {
    const { id } = req.params; // Get the post ID from the request parameters
    console.log("postbyId", id);
    // Fetch the post from the database
    //const post = await Post.findOne({ _id: id });

    

    // Fetch the post from DB
    const post = await Post.findById(id)
      .populate("userId", "username profilePic")
      .populate("userId", "username profilePic")
      .populate({
        path: "comments.userId",
        select: "_id  username profilePic",
      });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Return the post data
    res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// delete post

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the authenticated user is the post owner
    if (post.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this post" });
    }

    // Perform deletion
    await post.deleteOne();

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Increment impressions
{
  /*export const incrementImpression=  async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.postId, { $inc: { impressions: 1 } }, { new: true });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}*/
}

export const incrementImpression = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming userId is sent from the frontend

    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if the logged-in user is the owner of the post
    if (post.userId.toString() === userId) {
      return res
        .status(200)
        .json({
          message: "You viewed your own post. Impression not recorded.",
        });
    }

    // Increment impressions only for other users
    post.impressions += 1;
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// update sticky time

export const updateStickyTime = async (req, res) => {
  try {
    const { postId, stickyStartUTC, stickyEndUTC } = req.body;

    if (!postId || !stickyStartUTC || !stickyEndUTC) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        stickyStartUTC,
        stickyEndUTC,
        status: "published", // Change status from draft to published
      },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.status(200).json({
      message: "Sticky time updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error updating sticky time:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// post search

// In your post controller
{
  /*export const searchPost = async (req, res) => {
  try {
    const { query, userId } = req.query;
    console.log('Received search request with:', { query, userId }); // Add this line
   
    const searchConditions = {
      postStatus: 'published'
    };

    if (query) {
      searchConditions.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
       
      ];
    }

    if (userId) {
      searchConditions.userId = userId
    }

    const posts = await Post.find(searchConditions)
      .limit(10)
      .populate('userId', 'username profilePic') .sort({ createdAt: -1 });;
      console.log('Found posts:', posts.length);
 
      res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Search post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}*/
}

export const searchPost = async (req, res) => {
  try {
    const { query, userId } = req.query;
    console.log("Received search request with:", { query, userId });

    const searchConditions = {
      postStatus: "published",
    };

    let userMatchIds = [];

    if (query) {
      // Step 1: Find users matching the query
      const matchingUsers = await User.find(
        {
          $or: [
            { username: { $regex: query, $options: "i" } },
            { name: { $regex: query, $options: "i" } },
          ],
        },
        "_id"
      );
      userMatchIds = matchingUsers.map((user) => user._id);

      // Step 2: Build $or condition with both post fields and userId
      searchConditions.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } },
        { userId: { $in: userMatchIds } },
      ];
    }

    if (userId) {
      searchConditions.userId = userId;
    }

    const posts = await Post.find(searchConditions)
      .limit(10)
      .populate("userId", "username profilePic")
      .sort({ createdAt: -1 });

    console.log("Found posts:", posts.length);

    res.json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("Search post error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// search all
// In your unifiedSearch controller
export const unifiedSearch = async (req, res) => {
  try {
    const { query } = req.query;

    // Search users
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { bio: { $regex: query, $options: "i" } },
      ],
    }).limit(10);

    // Get user IDs from the found users
    const userIds = users.map((user) => user._id);

    // Search posts - include posts by matching users as well
    const posts = await Post.find({
      $or: [
        {
          postStatus: "published",
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
            { content: { $regex: query, $options: "i" } },
          ],
        },
        { userId: { $in: userIds } }, // Also include posts by matching users
      ],
    })
      .limit(10)
      .populate("userId", "username profilePic");

    res.json({
      success: true,
      data: {
        users: users.map((user) => user._doc),
        posts: posts.map((post) => post._doc),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const editComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId, commentId } = req.params;
    const { comment } = req.body;

    if (!comment || typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({ message: "Invalid comment data" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Find the comment
    const commentToEdit = post.comments.id(commentId);
    if (!commentToEdit)
      return res.status(404).json({ message: "Comment not found" });

    // Check if user is the comment author
    if (commentToEdit.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to edit this comment" });
    }

    // Update the comment
    commentToEdit.comment = comment;
    commentToEdit.updatedAt = new Date();
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate("userId", "username profilePic")
      .populate("comments.userId", "username profilePic");

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error in editComment controller:", error);
    res.status(500).json({ message: "Error editing comment", error });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Find the comment
    const commentToDelete = post.comments.id(commentId);
    if (!commentToDelete)
      return res.status(404).json({ message: "Comment not found" });

    // Check if user is the comment author or post author
    if (
      commentToDelete.userId.toString() !== userId &&
      post.userId.toString() !== userId
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this comment" });
    }

    // Remove the comment
    post.comments.pull(commentId);
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate("userId", "username profilePic")
      .populate("comments.userId", "username profilePic");

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error in deleteComment controller:", error);
    res.status(500).json({ message: "Error deleting comment", error });
  }
};

// report post
 export const reportPost= async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason, reportType } = req.body;
    const userId = req.user.id

    // Validate input
    if (!reportType) {
      return res.status(400).json({ message: 'Please select a report type' });
    }

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

   if (!post.userId) {
  return res.status(400).json({ message: 'Post does not have a user ID' });
}

if (post.userId.toString() === userId.toString()) {
  return res.status(400).json({ message: 'You cannot report your own post' });
}


    // Check if user has already reported this post
  const existingReport = post.reports.find(report =>
  report?.reportedBy?.toString() === userId.toString() &&
  report?.status === 'pending'
);

    
    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this post' });
    }

    // Add report to post
    post.reports.push({
      reportedBy: userId,
      reason: reason || reportType,
      reportType,
      status: 'pending'
    });

    await post.save();

    // Create notification for admin (optional)
    // You'll need to implement this based on your notification system

    res.status(200).json({ message: 'Post reported successfully. Admin will review it.' });
  } catch (error) {
    console.error('Error reporting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
