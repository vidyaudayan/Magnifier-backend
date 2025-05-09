import { cloudinaryInstance } from "../config/cloudinary.js";
import Contact from "../Model/contactModel.js";
import nodemailer from 'nodemailer';
import { uploadToS3 } from "../utils/s3Uploader.js";

export const saveContact = async (req, res) => {
    const {contactDetails } = req.body;
  const parsedDetails = JSON.parse(contactDetails);
    try {
      // Destructure form data
      const {
        fullName,
        age,
        gender,
        webMagnifierUsername,
        organizationName,
        phone,   
        email,  
        message,
      } = parsedDetails;
      const file = req.file;
      let identityProofUrl = null;
      if (file) {
        try {
          {/*const uploadResult = await cloudinaryInstance.uploader.upload(file.path, {
            folder: 'identityProofs',
            resource_type: "raw",
            access_mode: "public"
            //public_id: "job_applications/resume" // Optional: Specify a folder in Cloudinary
          });*/}


          //identityProofUrl = uploadResult.secure_url;
        
          const s3UploadResult = await uploadToS3(file, 'id-card');
          identityProofUrl = s3UploadResult.url;
          
        
        } catch (uploadError) {
          console.error('Error uploading to Cloudinary:', uploadError);
          return res.status(500).json({ success: false, message: 'Identity proof upload failed' });
        }
      }
      // Create new contact document
      const contact = new Contact({
        fullName,
        age,
        gender,
        webMagnifierUsername,
        organizationName,
        identityProof:identityProofUrl,
        phone,
        email,
        message,
      });
  
      // Save the contact in MongoDB
      await contact.save();
  
      // Send Confirmation Email
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USERNAME, // Your email
          pass: process.env.EMAIL_PASSWORD, // Your email password
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: "Inquiry Received - Magnifier",
        text: `Dear ${fullName},\n\nThank you for reaching out to us. We have received your inquiry and will get back to you shortly.\n\nBest Regards,\nTeam Magnifier`,
      };
  
      await transporter.sendMail(mailOptions);
  
      // Send success response
      res.status(201).json({
        success: true,
        message: "Contact details saved successfully. Email sent.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server Error! Could not save contact details.",
      });
    }
  };

  export const getAllContacts=  async (req, res) => {
    try {
      const contacts = await Contact.find({});
      res.status(200).json(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ message: 'Failed to fetch contacts' });
    }
  }