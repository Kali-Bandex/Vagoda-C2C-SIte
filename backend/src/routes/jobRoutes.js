const express = require("express");
const multer = require("multer");
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  uploadJobImage,
} = require("../controllers/jobController");
const { protect } = require("../middleware/auth");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for job images"), false);
    }
  },
});

router.get("/", getJobs);
router.get("/:id", getJobById);
router.post("/", protect, createJob);
router.put("/:id", protect, updateJob);
router.delete("/:id", protect, deleteJob);
router.post("/upload-image", protect, upload.single("file"), uploadJobImage);

module.exports = router;
