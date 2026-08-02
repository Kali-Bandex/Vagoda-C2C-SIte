const express = require("express");
const multer = require("multer");
const {
  applyToJob,
  getApplicantApplications,
  getRecruiterApplications,
  updateApplicationStatus,
  withdrawApplication,
  checkIfApplied,
  uploadResume,
} = require("../controllers/applicationController");
const { protect } = require("../middleware/auth");

const router = express.Router();

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, DOCX, or image files are allowed for resumes"), false);
    }
  },
});

router.post("/", protect, applyToJob);
router.get("/applicant", protect, getApplicantApplications);
router.get("/recruiter", protect, getRecruiterApplications);
router.patch("/:id/status", protect, updateApplicationStatus);
router.delete("/:id", protect, withdrawApplication);
router.get("/check/:jobId", protect, checkIfApplied);
router.post("/upload-resume", protect, resumeUpload.single("file"), uploadResume);

module.exports = router;
