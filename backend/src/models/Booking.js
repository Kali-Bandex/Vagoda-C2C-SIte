const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, "Customer email is required"],
      trim: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      required: [true, "Customer phone is required"],
      trim: true,
    },
    serviceDate: {
      type: Date,
      required: [true, "Service date is required"],
    },
    serviceTime: {
      type: String,
      default: "Morning",
    },
    serviceAddress: {
      type: String,
      required: [true, "Service address is required"],
      trim: true,
    },
    notes: {
      type: String,
      default: "",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "In Progress", "Completed", "Cancelled"],
      default: "Pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ serviceId: 1, customerId: 1 });
bookingSchema.index({ providerId: 1, status: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
