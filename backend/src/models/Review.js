const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: "https://i.pravatar.cc/80?img=12",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    body: {
      type: String,
      required: [true, "Review body is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

// One review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
