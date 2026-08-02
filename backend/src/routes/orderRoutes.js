const express = require("express");
const {
  createOrder,
  getBuyerOrders,
  getSellerOrders,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/buyer", protect, getBuyerOrders);
router.get("/seller", protect, getSellerOrders);
router.patch("/:id/status", protect, updateOrderStatus);

module.exports = router;
