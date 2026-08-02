const { PutObjectCommand } = require("@aws-sdk/client-s3");
const Application = require("../models/Application");
const Job = require("../models/Job");
const Notification = require("../models/Notification");
const { s3Client, bucketName } = require("../config/s3");

// Generate a unique application number
function generateAppNumber() {
  return `APP-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

// Helper: format application for client
const formatApplication = (app) => ({
  id: app._id.toString(),
  applicationNumber: app.applicationNumber,
  jobId: app.jobId?._id?.toString() || app.jobId?.toString(),
  job: app.jobId && typeof app.jobId === "object"
    ? {
        id: app.jobId._id.toString(),
        title: app.jobId.title,
        company: app.jobId.company,
        companyLogo: app.jobId.companyLogo || "",
        location: app.jobId.location,
        type: app.jobId.type,
        salary: app.jobId.salaryLabel || (app.jobId.salaryMax
          ? `$${app.jobId.salaryMin?.toLocaleString()}–$${app.jobId.salaryMax?.toLocaleString()}`
          : "Competitive"),
        deadline: app.jobId.deadline ? app.jobId.deadline.toISOString() : null,
        status: app.jobId.status,
        color: app.jobId.color || "#4F46E5",
      }
    : null,
  applicantId: app.applicantId?._id?.toString() || app.applicantId?.toString(),
  applicant: app.applicantId && typeof app.applicantId === "object"
    ? {
        id: app.applicantId._id.toString(),
        name: app.applicantId.name,
        avatar: app.applicantId.avatar,
        email: app.applicantId.email,
        phone: app.applicantId.phone || "",
      }
    : null,
  recruiterId: app.recruiterId?.toString(),
  name: app.name,
  email: app.email,
  phone: app.phone || "",
  coverLetter: app.coverLetter || "",
  resumeUrl: app.resumeUrl || "",
  status: app.status,
  appliedAt: app.createdAt,
  createdAt: app.createdAt,
});

// @desc    Apply for a job
// @route   POST /api/applications
// @access  Private
const applyToJob = async (req, res, next) => {
  try {
    const { jobId, name, email, phone, coverLetter, resumeUrl } = req.body;

    if (!jobId || !name || !email) {
      return res.status(400).json({ message: "jobId, name and email are required" });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.status !== "Open") {
      return res.status(400).json({ message: "This job is no longer accepting applications" });
    }

    // Check for duplicate application
    const existing = await Application.findOne({
      jobId,
      applicantId: req.user._id,
    });
    if (existing) {
      return res.status(409).json({ message: "You have already applied for this job" });
    }

    const application = await Application.create({
      applicationNumber: generateAppNumber(),
      jobId,
      applicantId: req.user._id,
      recruiterId: job.recruiterId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || "",
      coverLetter: coverLetter || "",
      resumeUrl: resumeUrl || "",
    });

    // Increment applicant count on job
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantCount: 1 } });

    // Notify the recruiter
    try {
      await Notification.create({
        userId: job.recruiterId,
        fromUserId: req.user._id,
        type: "application_received",
        title: "New Application Received",
        body: `${name} applied for "${job.title}"`,
        link: `/app/activity`,
      });
    } catch (_) {}

    // Notify the applicant
    try {
      await Notification.create({
        userId: req.user._id,
        fromUserId: job.recruiterId,
        type: "application_submitted",
        title: "Application Submitted",
        body: `Your application for "${job.title}" at ${job.company} was received.`,
        link: `/dashboard?tab=applications`,
      });
    } catch (_) {}

    res.status(201).json({ application: formatApplication(application) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "You have already applied for this job" });
    }
    next(error);
  }
};

// @desc    Get all applications submitted by the logged-in applicant
// @route   GET /api/applications/applicant
// @access  Private
const getApplicantApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ applicantId: req.user._id })
      .populate("jobId", "title company companyLogo location type salaryMin salaryMax salaryLabel deadline status color")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ applications: applications.map(formatApplication) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications for jobs posted by the recruiter
// @route   GET /api/applications/recruiter
// @access  Private
const getRecruiterApplications = async (req, res, next) => {
  try {
    const { jobId, status, q } = req.query;

    const queryObj = { recruiterId: req.user._id };
    if (jobId) queryObj.jobId = jobId;
    if (status && status !== "All") queryObj.status = status;

    let apps = await Application.find(queryObj)
      .populate("applicantId", "name avatar email phone")
      .populate("jobId", "title company location type")
      .sort({ createdAt: -1 })
      .lean();

    // Text search filter in memory (applicant name / job title)
    if (q && q.trim()) {
      const lower = q.trim().toLowerCase();
      apps = apps.filter(
        (a) =>
          a.name?.toLowerCase().includes(lower) ||
          a.email?.toLowerCase().includes(lower) ||
          (a.jobId?.title || "").toLowerCase().includes(lower)
      );
    }

    res.json({ applications: apps.map(formatApplication) });
  } catch (error) {
    next(error);
  }
};

// @desc    Update application status (recruiter only)
// @route   PATCH /api/applications/:id/status
// @access  Private (Recruiter)
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Submitted", "Under Review", "Shortlisted", "Rejected", "Hired"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const app = await Application.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (app.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this application" });
    }

    app.status = status;
    await app.save();

    // Notify applicant of status change
    try {
      const job = await Job.findById(app.jobId).select("title company");
      await Notification.create({
        userId: app.applicantId,
        fromUserId: req.user._id,
        type: "application_status_changed",
        title: "Application Status Updated",
        body: `Your application for "${job?.title || "a job"}" is now: ${status}`,
        link: `/dashboard?tab=applications`,
      });
    } catch (_) {}

    res.json({ application: formatApplication(app) });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw an application (applicant only)
// @route   DELETE /api/applications/:id
// @access  Private (Applicant)
const withdrawApplication = async (req, res, next) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (app.applicantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to withdraw this application" });
    }

    await Application.deleteOne({ _id: app._id });

    // Decrement applicant count
    await Job.findByIdAndUpdate(app.jobId, { $inc: { applicantCount: -1 } });

    res.json({ message: "Application withdrawn successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if current user already applied for a job
// @route   GET /api/applications/check/:jobId
// @access  Private
const checkIfApplied = async (req, res, next) => {
  try {
    const existing = await Application.findOne({
      jobId: req.params.jobId,
      applicantId: req.user._id,
    }).select("_id status applicationNumber");

    if (existing) {
      return res.json({
        applied: true,
        applicationId: existing._id.toString(),
        status: existing.status,
        applicationNumber: existing.applicationNumber,
      });
    }

    res.json({ applied: false });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload resume/CV to S3
// @route   POST /api/applications/upload-resume
// @access  Private
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const file = req.file;
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `resumes/${Date.now()}-${sanitized}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    const region = process.env.AWS_REGION || "eu-north-1";
    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    res.json({ url, key });
  } catch (error) {
    console.error("Resume upload error:", error);
    res.status(500).json({ message: `Upload failed: ${error.message}` });
  }
};

module.exports = {
  applyToJob,
  getApplicantApplications,
  getRecruiterApplications,
  updateApplicationStatus,
  withdrawApplication,
  checkIfApplied,
  uploadResume,
};
