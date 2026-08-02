const express = require("express");
const { getOverview } = require("../controllers/overviewController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET /api/overview  — protected, returns stats + chart + transactions
router.get("/", protect, getOverview);

module.exports = router;
