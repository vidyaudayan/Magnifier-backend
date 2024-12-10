import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String },
    description: { type: String },
    content: { type: String, default: '' }, // URL for images or voice notes
    mediaUrl: { type: String ,  default: ''},
    postType: { type: String, enum: ['Text', 'Photo', 'VoiceNote'], required: true },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default:0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        comment: { type: String  },
        createdAt: { type: Date, default: Date.now },
      }
    ]
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);
export default Post;
   