const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Service title is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      default: "Home",
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    oldPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      index: true,
    },
    image: {
      type: String,
      required: [true, "Main image is required"],
    },
    gallery: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    specs: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Paused", "Draft"],
      default: "Active",
      index: true,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    bookingsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

serviceSchema.index({ title: "text", description: "text", category: "text" });
serviceSchema.index({ category: 1, status: 1, location: 1 });

module.exports = mongoose.model("Service", serviceSchema);
