import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String },
    description: { type: String },
    content: { type: String, default: '' }, // URL for images or voice notes
    mediaUrl: { type: String ,  default: ''},
    postType: { type: String, enum: ['Text', 'Photo', 'VoiceNote'], required: true },
    sticky: { type: Boolean, default: false },
    stickyUntil: { type: Date, default: null },
    likes: { type: Number, default: 0 },
    stickyDuration: { type: Number, enum: [0,1, 3, 6, 12], default: 0 } ,
    dislikes: { type: Number, default:0 },
    impressions: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    postStatus: { 
      type: String, 
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    paymentIntent: { type: String },
    comments: [ 
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        comment: { type: String  },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }  
);   

const Post = mongoose.model('Post', postSchema);
export default Post;    
   