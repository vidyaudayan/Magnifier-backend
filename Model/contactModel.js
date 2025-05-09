import mongoose from "mongoose";

// Define the Contact Schema
const contactSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true, // Removes whitespace from both ends of the string
    },
    age: {
      type: Number,
      required: true,
      min: 18, // Minimum age validation
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female"], // Accepts only these values
    },
    webMagnifierUsername: {
      type: String,
      trim: true,
    },
    organizationName: {
      type: String,
      trim: true,
    },
    identityProof: {
      type: String, // Store the file path or URL of uploaded identity proof
      required: true,
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          // Regex for valid phone numbers
          return /^\d{10}$/.test(v);
        },
        message: "Invalid phone number! Must be 10 digits.",
      },
    },
    email: {
      type: String,
      required: true,
      
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          // Regex for valid email
          return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
        },
        message: "Invalid email address!",
      },
    },
    message: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now, // Automatically saves the timestamp
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const Contact = mongoose.model("Contact", contactSchema);

export  default Contact 
