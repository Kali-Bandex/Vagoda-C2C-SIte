const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    companyLogo: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Remote", "Internship"],
      default: "Full-time",
      index: true,
    },
    mode: {
      type: String,
      enum: ["On-site", "Remote", "Hybrid"],
      default: "On-site",
    },
    industry: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "Engineering",
      trim: true,
      index: true,
    },
    salaryMin: {
      type: Number,
      min: 0,
      default: 0,
    },
    salaryMax: {
      type: Number,
      min: 0,
      default: 0,
    },
    salaryLabel: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    deadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Open", "Closed", "Draft"],
      default: "Open",
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    applicantCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    color: {
      type: String,
      default: "#4F46E5",
    },
  },
  {
    timestamps: true,
  }
);

// Full-text search + compound indexes
jobSchema.index({ title: "text", description: "text", company: "text" });
jobSchema.index({ category: 1, status: 1, location: 1 });
jobSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model("Job", jobSchema);
