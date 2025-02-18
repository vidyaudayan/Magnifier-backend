import twilio from "twilio";
import dotenv from "dotenv";
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendSMS = async (to, message) => {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio number
      to: to, // User's phone number
    });
    console.log(`SMS sent successfully to ${to}`);
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
};
