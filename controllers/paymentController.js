import Stripe from "stripe";
import Payment from "../Model/paymentModel.js";
import Post from "../Model/postModel.js";
import dotenv from "dotenv";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
dotenv.config();

// Create a payment intent
{/*export const createPaymentIntent = async (req, res) => {
  try {
    const { duration, startHour, endHour, pinPost } = req.body;
    const  userId= req.user.id
    const amount = duration * 3000; 
    const paymentIntent = await stripe.paymentIntents.create({
      amount, 
      currency: "inr",
      payment_method_types: ["card"],
    });

    // Save payment details in DB (Post ID will be added after success)
    const newPayment = await Payment.create({
      userId,
      amount,
      currency: "inr",
      paymentIntentId: paymentIntent.id,
      duration,
      startHour,
      endHour,
      status: "pending",
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentId: newPayment._id,
      message: "Payment intent created",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
};*/}

export const createPaymentIntent = async (req, res) => {
  try {
    const { duration, startHour, endHour, pinPost } = req.body;
    const userId = req.user.id;
    const amount = duration * 3000; // Amount in paise (INR)

    // Create PaymentIntent with metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "inr",
      payment_method_types: ["card"],
      metadata: {
        userId, // Store user ID in metadata for later reference
        duration,
        startHour,
        endHour,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret, // Send clientSecret to frontend
      paymentIntentId: paymentIntent.id, // Send paymentIntentId for tracking
      message: "Payment intent created",
    });
  } catch (error) {
    console.error("🚨 Error creating payment intent:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
};



export const webhook=  async (req, res) => {
  const sig = req.headers["stripe-signature"]; // Get Stripe signature from headers

  try {
    // Verify Stripe Webhook
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      console.log("🔹 Searching for paymentIntentId:", paymentIntent.id);
      // Find and update payment in DB
      const updatedPayment = await Payment.findOneAndUpdate(
        { paymentIntentId: paymentIntent.id },
        { status: "succeeded" },
        { new: true }
      );

      if (updatedPayment) {
        console.log(`✅ Payment ${paymentIntent.id} succeeded and updated in DB`);
      } else {
        console.log(`⚠️ PaymentIntent ${paymentIntent.id} not found in DB`);
      }
    }

    res.status(200).send({ received: true });
  } catch (err) {
    console.error("🚨 Webhook Error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}