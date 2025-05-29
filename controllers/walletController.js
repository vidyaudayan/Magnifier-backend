import User from "../Model/userModel.js";
import crypto from 'crypto';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export const getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
console.log('Fetched wallet data:', {
  earnedPoints: user.earnedPoints,
  rechargedPoints: user.rechargedPoints,
  transactions: user.walletTransactions
});
    res.status(200).json({
      earnedPoints: user.earnedPoints || 0,
      rechargedPoints: user.rechargedPoints || 0,
      totalPoints: (user.earnedPoints || 0) + (user.rechargedPoints || 0),
      transactions: user.walletTransactions || []
    });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    res.status(500).json({ message: "Error fetching wallet balance" });
  }
};

export const rechargeWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const amountInPaise = Math.round(amount * 100); // Convert to paise for Razorpay

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ message: "Error creating payment order" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } = req.body;
    
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const pointsToAdd = Math.floor(amount / 10); // Assuming 10 INR = 1 point

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $inc: { rechargedPoints: pointsToAdd },
        $push: {
          walletTransactions: {
            type: 'recharge',
            amount: pointsToAdd,
            status: 'success',
            timestamp: new Date(),
            description: 'Wallet recharge',
            reference: razorpay_payment_id
          }
        }
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Wallet recharged successfully",
      rechargedPoints: user.rechargedPoints,
      totalPoints: (user.earnedPoints || 0) + user.rechargedPoints
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Error verifying payment" });
  }
};