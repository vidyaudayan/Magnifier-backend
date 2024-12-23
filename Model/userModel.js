import mongoose from "mongoose";


const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true },
    profilePic: { type: String, default: "" },
    fathersName: { type: String },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other', 'male', 'female', 'other'] },
    vidhanSabha: { type: String },
    wardNumber: { type: Number },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
   
    walletAmount: { type: Number, default: 0 },
    isFirstLogin: { type: Boolean, default: true },
    //reactions: [{ postId: String, reactionType: String }] ,
    reactions: [
      {
          postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, // Refers to the post
          reactionType: { type: String, enum: ['like', 'dislike'] },   // Reaction type
          reactedAt: { type: Date, default: Date.now }                // When the reaction was made
      }
  ],
    resetToken: String,
    resetTokenExpiration: Date, 
    posts: [ 
        {
        type: mongoose.Schema.Types.ObjectId, ref: 'Post'
        }
      ]
   
  },
  { timestamps : true }
);

const User = mongoose.model("User", userSchema);
export default User;