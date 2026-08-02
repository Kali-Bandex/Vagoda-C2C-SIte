const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
      index: true,
    },
    oldPrice: {
      type: Number,
      min: 0,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ["product", "service"],
      default: "product",
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      required: [true, "Product image URL is required"],
    },
    gallery: {
      type: [String],
      default: [],
    },
    video: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },
    // New fields for rich product details
    sizes: {
      type: [String],
      default: [],
    },
    colours: {
      type: [String],
      default: [],
    },
    specs: {
      type: [
        {
          key: { type: String, trim: true },
          value: { type: String, trim: true },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index and text search index
productSchema.index({ category: 1, price: 1, location: 1 });
productSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
