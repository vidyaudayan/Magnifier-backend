import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const sendOtpEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        host: "smtp.gmail.com",
        port: 587,
        secure: false, 
        auth: {
            user: process.env.EMAIL_USERNAME, // Add these to your .env
            pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false, // Allow self-signed certificates (if needed)
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}`,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};
