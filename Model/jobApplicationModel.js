import mongoose from "mongoose";
const jobApplicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String },
    experience: { type: String },
    qualification: { type: String },
    resume: { type: String }, // File URL for uploaded resumes
  
  
  });
   
  const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
  export default JobApplication;   