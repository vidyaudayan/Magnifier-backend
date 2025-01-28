import Post from '../Model/postModel.js';
import { cloudinaryInstance } from '../config/cloudinary.js';
import User from '../Model/userModel.js'


{/*export const createPost = async (req, res) => {
  console.log("land")
  //console.log(req)
  try {

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: User ID missing' });
    }
    const file = req.file;
    const userId = req.user.id
    const {  postType, content } = req.body;
    console.log("content",content)
    console.log("User ID:", userId);
    //console.log("Request Body:", req.body);
    console.log("Uploaded File:", req.file);
 
// Handle file upload
let mediaUrl = null;
{/*if (file) {
  try {
    const uploadResult = await cloudinaryInstance.uploader.upload(file.path, {
      folder: 'posts',
      resource_type: "auto",
      //access_mode: "public"
      //public_id: "job_applications/resume" // Optional: Specify a folder in Cloudinary
    });
    mediaUrl = uploadResult.secure_url;
  } catch (uploadError) {
    console.error('Error uploading to Cloudinary:', uploadError);
    return res.status(500).json({ success: false, message: 'Media upload failed' });
  }
}*/}


{/*if (file) {
  try {
    // Check the file type
    const fileType = file.mimetype.split('/')[0];

    if (fileType === 'audio') {
      // Upload as audio using Cloudinary
      const uploadResult = await cloudinaryInstance.uploader.upload(file.path, {
        folder: 'posts',
        //resource_type: 'auto', // This ensures Cloudinary determines the file type (audio, image, etc.)
        resource_type: fileType === 'audio' ? 'video' : 'image', 
      });
      mediaUrl = uploadResult.secure_url;
    } else {
      // If not audio, handle as image or other media type
      const uploadResult = await cloudinaryInstance.uploader.upload(file.path, {
        folder: 'posts',
        //resource_type: 'auto',
        resource_type: fileType === 'audio' ? 'video' : 'image', 
      });
      mediaUrl = uploadResult.secure_url;
    }
  } catch (uploadError) {
    console.error('Error uploading to Cloudinary:', uploadError);
    return res.status(500).json({ success: false, message: 'Media upload failed' });
  }
}
// If a file is uploaded, get its URL from Cloudinary
//const mediaUrl = req.file ? req.file.path : null;
if (!content && !mediaUrl) {
  return res.status(400).json({ message: "Content or media is required" });
}
    const newPost = new Post({
      userId,
      postType,
      //content: postType === "Text" ? content : mediaUrl, 
      //content: postType === "Text" ? content : '',  // Store only content if text post
      
      content: postType === "Text" ? content : (postType === "Photo"||"voiceNote" && content ? content : ''),
      //mediaUrl: postType !== "Text" ? mediaUrl : '', 
      
      //content: postType === "Text" ? content : '', // Text posts will have content, others won't
//mediaUrl: postType !== "Text" && mediaUrl ? mediaUrl : '', // Non-text posts will have mediaUrl if available
mediaUrl: postType === "Photo" || postType === "VoiceNote" ? mediaUrl : '', 
      status: "pending",
    });

    const savedPost = await newPost.save();
    const populatedPost = await Post.findById(savedPost._id).populate('userId', 'username profilePic');
    //res.status(201).json(savedPost);
    res.status(201).json({
      data:populatedPost,
      message: "Post created",
      success : true,
      error:false, 
     
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: 'Error creating post', error });
  }
};*/}
// create post new
export const createPost = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: User ID missing' });
    }

    const file = req.file;
    const userId = req.user.id;
    const { postType, content } = req.body;

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
    const post = await Post.findById(postId);
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
    console.log("postbyId")
    // Fetch the post from the database
    const post = await Post.findOne({ _id: id });

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
