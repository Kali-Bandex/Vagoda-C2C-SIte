const express = require("express");
const { getReviews, addReview } = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");

const router = express.Router({ mergeParams: true }); // mergeParams to get :id from parent

router.get("/", getReviews);
router.post("/", protect, addReview);

module.exports = router;
