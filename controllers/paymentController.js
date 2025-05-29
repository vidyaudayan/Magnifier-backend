import Razorpay from "razorpay";
import Payment from "../Model/paymentModel.js";
import User from "../Model/userModel.js";
import Post from "../Model/postModel.js";
import Slot from "../Model/slotModel.js";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


export const createOrder= async (req, res) => {
  try {
    const { postId, amount, duration, startHour, endHour } = req.body;
    console.log('User:', req.user);
    const userId = req.user.id;
   
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User authentication missing' });
    }
    // 1. Validate request body
    if (!postId || !amount || !duration || startHour === undefined || endHour === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 2. Validate post exists
    const post = await Post.findById(postId).lean();
    if (!post) {
      return res.status(400).json({ error: 'Post not found' });
    }

    // 3. Verify post status and ownership
    if (post.postStatus !== 'draft') {
      return res.status(400).json({ 
        error: 'Invalid post status',
        actualStatus: post.postStatus,
        requiredStatus: 'draft'
      });
    }

   
    // 4. Validate slot parameters
    if (startHour >= endHour) {
      return res.status(400).json({ error: 'Invalid time slot' });
    }

    // 5. Create order
    const order = await razorpay.orders.create({
      amount: amount,
      currency: "INR",
      receipt: `post_${postId}`,
      notes: {
        postId: postId,
        duration: duration,
        timeSlot: `${startHour}-${endHour}`
      }
    });

    // Return success with debug info
    res.json({
      success: true,
      order,
      debug: {
        postStatus: post.postStatus,
        //userIdMatch: post.userId.toString() === req.user._id.toString()
      }
    });

  } catch (error) {
    console.error('Payment error:', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    res.status(500).json({ error: 'Payment processing failed' });
  }
}

// create payment intent
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, postId, duration, startHour, endHour } = req.body;
    const userId = req.user.id;

    // Validate all required fields exist
    if (!amount || !postId || !duration || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: {
          amount: !amount,
          postId: !postId,
          duration: !duration,
          userId: !userId
        }
      });
    }

    // 1. Create Razorpay order first to get paymentIntentId
    const razorpayOrder = await razorpay.orders.create({
      amount: amount,
      currency: "INR",
      receipt: `p_${postId.slice(-8)}_${Date.now().toString().slice(-6)}`,
      payment_capture: 1,
      notes: {
        postId,
        userId,
        fullReference: `post_${postId}_user_${userId}`
      }
    });

    // 2. Create payment record with ALL required fields
    const payment = new Payment({
      userId: userId,
      amount: amount,
      currency: "INR",
      paymentIntentId: razorpayOrder.id, // From Razorpay response
      razorpay_order_id: razorpayOrder.id,
      status: "pending",
      duration,
      startHour,
      endHour,
      postId
    });

    await payment.save();

    res.json({
      success: true,
      order: razorpayOrder,
      paymentId: payment._id
    });

  } catch (error) {
    console.error('Payment processing error:', {
      errorType: error.name,
      validationError: error.errors,
      razorpayError: error.error,
      stack: error.stack
    });

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Payment validation failed',
        missingFields: Object.keys(error.errors)
      });
    }

    res.status(500).json({ 
      error: 'Payment processing failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
//  verify Payment

{/*export const verifyPayment = async (req, res) => {
  try {
    // Get userId from authenticated user
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      console.error('User ID missing in verification:', {
        user: req.user,
        headers: req.headers
      });
      return res.status(401).json({ error: 'User authentication missing' });
    }

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      postId,
      paymentId,
      amount,
      duration,
      startHour,
      endHour,stickyStartUTC,
      stickyEndUTC
    } = req.body;

    // Validate required fields
    const requiredFields = {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      postId,
      paymentId,
      amount,
      duration,
      userId
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing: missingFields
      });
    }

    // Verify payment signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update payment record
    const updatedPayment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: 'succeeded',
        razorpay_payment_id,
        razorpay_signature,
        userId // Ensure userId is set
      },
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(400).json({ error: 'Payment record not found' });
    }

   
    // Update post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        status: 'pending',
        sticky: true,
        //stickyUntil: new Date(Date.now() + duration * 60 * 60 * 1000),
        stickyFrom: new Date(stickyStartUTC), // optional but good
        stickyUntil: new Date(stickyEndUTC),
        stickyDuration: duration,
        postStatus: 'published',
        paymentIntent: razorpay_payment_id
      },
      { new: true }
    );

    // Update slots
    const slotUpdates = [];
    for (let hour = startHour; hour < endHour; hour++) {
      slotUpdates.push(
        Slot.findOneAndUpdate(
          { hour },
          {
            booked: true,
            bookedAt: new Date(),
            bookedBy: postId,
            postId
          },
          { upsert: true, new: true }
        )
      );
    }
    await Promise.all(slotUpdates);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment: updatedPayment,
      post: updatedPost
    });

  } catch (error) {
    console.error('Payment verification error:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      user: req.user
    });
    res.status(500).json({ 
      error: 'Payment verification failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};*/}



export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } = req.body;
    const userId = req.user.id;

    // 1. First verify the user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 2. Verify the payment signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature'
      });
    }

    // 3. Calculate points (1 INR = 1 point in this example)
    const pointsToAdd = Math.floor(amount);

    // 4. Update user's wallet and transaction history
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          walletAmount: pointsToAdd,
          rechargedPoints: pointsToAdd
        },
        $push: {
          walletTransactions: {
            type: 'recharge',
            amount: pointsToAdd,
            status: 'success',
            description: `Wallet recharge of ${pointsToAdd} points via Razorpay`,
            reference: razorpay_payment_id
          }
        }
      },
      { new: true, runValidators: true } // Added runValidators
    );

    if (!updatedUser) {
      throw new Error('User update failed');
    }

    // 5. Send success response
    res.status(200).json({
      success: true,
      message: 'Payment verified and wallet recharged successfully',
      data: {
        newBalance: updatedUser.walletAmount,
        transactionId: razorpay_payment_id,
        pointsAdded: pointsToAdd
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    
    // Log failed transaction if error occurred after payment
    if (req.body.razorpay_payment_id) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          walletTransactions: {
            type: 'recharge',
            amount: Math.floor(req.body.amount),
            status: 'failed',
            description: `Failed wallet recharge attempt`,
            reference: req.body.razorpay_payment_id
          }
        }
      }).catch(console.error); // Added error handling for the fallback update
    }

    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

// controllers/userController.js
export const handlePaymentFailure = async (req, res) => {
  const { postId, paymentId, reason } = req.body;
  const userId = req.user.id;

  try {
    // Optionally, update your DB with a failed payment record
    await Payment.create({
      userId,
      postId,
      paymentId,
      status: "failed",
      reason,
      timestamp: new Date()
    });

    // You might also clean up temporary post if needed
    // await Post.deleteOne({ _id: postId, user: userId, isPinned: false });

    return res.json({ success: true, message: "Failure logged" });
  } catch (error) {
    console.error("Failed to log payment failure", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};
