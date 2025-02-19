import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

{/*export const sendSMS = async (to, message) => {
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
};*/}

export const sendSMS = async (to, message) => {
    try {
      // Ensure the phone number starts with "+"
      let formattedNumber = to.startsWith("+") ? to : `+91${to}`; // Assuming Indian numbers
  
      console.log(`Formatted Number: ${formattedNumber}`); // Debugging
  
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER, // Twilio's phone number
        to: formattedNumber, // Corrected format
      });
  
      console.log(`SMS sent successfully to ${formattedNumber}`);
    } catch (error) {
      console.error("Error sending SMS:", error);
    }
  };
