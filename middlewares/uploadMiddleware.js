import multer from "multer";

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

{/*import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinaryInstance } from "../config/cloudinary.js"; // Import your Cloudinary instance

// Define Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinaryInstance,
  params: {
    folder: "posts", // Specify the folder in Cloudinary
    //allowed_formats: ["jpg", "png", "mp3", "wav", "pdf", "docx"], // Allow images and audio formats
    resource_type: "auto", // Auto-detect file type
  },
});*/}




const upload = multer({ storage: storage });

export default upload;
