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