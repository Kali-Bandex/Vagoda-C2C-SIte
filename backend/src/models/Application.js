const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Applicant name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Applicant email is required"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    coverLetter: {
      type: String,
      default: "",
    },
    resumeUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Submitted", "Under Review", "Shortlisted", "Rejected", "Hired"],
      default: "Submitted",
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate applications from same user for same job
applicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
