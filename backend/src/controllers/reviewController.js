const Review = require("../models/Review");
const Product = require("../models/Product");
const { createNotification } = require("./notificationController");

// @desc  Get all reviews for a product (with rating breakdown)
// @route GET /api/products/:id/reviews
// @access Public
const getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ productId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    // Compute rating breakdown
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    reviews.forEach((r) => {
      breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
      total += r.rating;
    });
    const avgRating =
      reviews.length > 0 ? (total / reviews.length).toFixed(1) : "0.0";

    res.json({
      reviews: reviews.map((r) => ({
        id: r._id.toString(),
        userId: r.userId.toString(),
        name: r.name,
        avatar: r.avatar,
        rating: r.rating,
        body: r.body,
        createdAt: r.createdAt,
      })),
      count: reviews.length,
      avgRating: parseFloat(avgRating),
      breakdown,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Add a review (buyers only — one per user per product)
// @route POST /api/products/:id/reviews
// @access Private
const addReview = async (req, res, next) => {
  try {
    const { rating, body } = req.body;

    if (!rating || !body) {
      return res.status(400).json({ message: "Rating and review body are required" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Prevent seller reviewing their own product
    if (product.sellerId.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: "Sellers cannot review their own products" });
    }

    // Upsert — update existing review if already submitted
    const review = await Review.findOneAndUpdate(
      { productId: req.params.id, userId: req.user._id },
      {
        name: req.user.name,
        avatar: req.user.avatar || `https://i.pravatar.cc/80?u=${req.user._id}`,
        rating: Number(rating),
        body: body.trim(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Recompute avg rating on the product
    const allReviews = await Review.find({ productId: req.params.id });
    if (allReviews.length > 0) {
      const avg =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      product.rating = Math.min(5, Math.max(0, Math.round(avg * 10) / 10));
      await product.save();
    }

    // Notify the seller about the new review/comment
    if (product.sellerId && product.sellerId.toString() !== req.user._id.toString()) {
      await createNotification({
        userId: product.sellerId.toString(),
        type: "system",
        title: `New review on "${product.title}"`,
        body: `${req.user.name} rated ${rating}★: "${body.trim().slice(0, 80)}"`,
        fromUser: req.user._id,
        link: `/marketplace/${product._id}`,
      });
    }

    res.status(201).json({
      review: {
        id: review._id.toString(),
        userId: review.userId.toString(),
        name: review.name,
        avatar: review.avatar,
        rating: review.rating,
        body: review.body,
        createdAt: review.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getReviews, addReview };
