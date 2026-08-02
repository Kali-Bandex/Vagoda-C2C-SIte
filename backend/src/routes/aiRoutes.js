const express = require("express");
const router = express.Router();
const { semanticSearch } = require("../controllers/aiController");

// POST /api/ai/search & GET /api/ai/search
router.post("/search", semanticSearch);
router.get("/search", semanticSearch);

module.exports = router;
