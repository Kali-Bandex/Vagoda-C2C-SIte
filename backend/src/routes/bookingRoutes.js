const express = require("express");
const {
  createBooking,
  getCustomerBookings,
  getProviderBookings,
  updateBookingStatus,
  cancelBooking,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/customer", protect, getCustomerBookings);
router.get("/provider", protect, getProviderBookings);
router.patch("/:id/status", protect, updateBookingStatus);
router.delete("/:id", protect, cancelBooking);

module.exports = router;
