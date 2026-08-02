const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        qty: { type: Number, required: true, default: 1 },
        image: { type: String },
        selectedSize: { type: String },
        selectedColour: { type: String },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Received", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Received",
      index: true,
    },
    shippingAddress: {
      type: String,
      default: "Accra, Ghana",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
