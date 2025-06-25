import mongoose from "mongoose";



const bookingHistorySchema = new mongoose.Schema({
  slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bookedAt: Date,
  duration: Number,
  startHour: Number,
  endHour: Number,
  date: Date,
  cancelled: { type: Boolean, default: false },
  cancelledAt: Date
}, { timestamps: true });

module.exports = mongoose.model('BookingHistory', bookingHistorySchema);

// models/SlotArchive.js
const mongoose = require('mongoose');

const slotArchiveSchema = new mongoose.Schema({
  originalId: mongoose.Schema.Types.ObjectId,
  date: Date,
  startHour: Number,
  endHour: Number,
  duration: Number,
  type: String,
  booked: Boolean,
  bookedBy: mongoose.Schema.Types.ObjectId,
  postId: mongoose.Schema.Types.ObjectId,
  bookedAt: Date,
  stickyUntil: Date,
  archivedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SlotArchive', slotArchiveSchema);