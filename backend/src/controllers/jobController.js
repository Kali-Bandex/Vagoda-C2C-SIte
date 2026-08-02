const { PutObjectCommand } = require("@aws-sdk/client-s3");
const Job = require("../models/Job");
const User = require("../models/User");
const { s3Client, bucketName } = require("../config/s3");

// Helper: transform Mongo document for client
const formatJob = (j, recruiter = null) => ({
  id: j._id.toString(),
  recruiterId: j.recruiterId?.toString(),
  title: j.title,
  company: j.company,
  companyLogo: j.companyLogo || "",
  location: j.location,
  type: j.type,
  mode: j.mode,
  industry: j.industry || "",
  category: j.category,
  salaryMin: j.salaryMin || 0,
  salaryMax: j.salaryMax || 0,
  salaryLabel: j.salaryLabel || "",
  // Backwards-compatible salary string for existing UI
  salary: j.salaryLabel || (j.salaryMax ? `$${j.salaryMin?.toLocaleString()}–$${j.salaryMax?.toLocaleString()}` : "Competitive"),
  description: j.description || "",
  responsibilities: j.responsibilities || [],
  skills: j.skills || [],
  email: j.email || "",
  deadline: j.deadline ? j.deadline.toISOString() : null,
  status: j.status,
  views: j.views || 0,
  applicantCount: j.applicantCount || 0,
  color: j.color || "#4F46E5",
  // Computed fields for existing JobCard compatibility
  posted: j.createdAt ? timeAgo(j.createdAt) : "Recently",
  studio: recruiter ? `${recruiter.companyName || j.company} • ${j.location}` : `${j.company} • ${j.location}`,
  tag: j.category,
  recruiter: recruiter
    ? {
        id: recruiter._id.toString(),
        name: recruiter.name,
        avatar: recruiter.avatar,
        companyName: recruiter.companyName || j.company,
        companyLogo: recruiter.companyLogo || j.companyLogo,
        location: recruiter.location || j.location,
        phone: recruiter.phone || "",
        website: recruiter.website || "",
      }
    : null,
  createdAt: j.createdAt,
  updatedAt: j.updatedAt,
});

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

// @desc    Get all jobs with filtering, search, sorting and pagination
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res, next) => {
  try {
    const {
      category,
      type,
      mode,
      location,
      search,
      minSalary,
      maxSalary,
      recruiterId,
      status,
      sort,
      page = 1,
      limit = 9,
    } = req.query;

    const queryObj = {};

    // Only show open jobs by default unless recruiter is viewing their own
    if (recruiterId) {
      queryObj.recruiterId = recruiterId;
    } else {
      queryObj.status = status || "Open";
    }

    if (category && category !== "All") {
      queryObj.category = category;
    }

    if (type && type !== "All") {
      queryObj.type = type;
    }

    if (mode && mode !== "All") {
      queryObj.mode = mode;
    }

    if (location && location.trim()) {
      queryObj.location = new RegExp(location.trim(), "i");
    }

    if (minSalary !== undefined && minSalary !== "") {
      queryObj.salaryMin = { $gte: Number(minSalary) };
    }

    if (maxSalary !== undefined && maxSalary !== "") {
      queryObj.salaryMax = { ...queryObj.salaryMax, $lte: Number(maxSalary) };
    }

    if (search && search.trim()) {
      queryObj.$or = [
        { title: new RegExp(search.trim(), "i") },
        { description: new RegExp(search.trim(), "i") },
        { company: new RegExp(search.trim(), "i") },
        { skills: new RegExp(search.trim(), "i") },
      ];
    }

    let sortObj = { createdAt: -1 };
    if (sort === "Most Applied") sortObj = { applicantCount: -1, createdAt: -1 };
    else if (sort === "Salary") sortObj = { salaryMax: -1, salaryMin: -1 };
    else if (sort === "Trending") sortObj = { views: -1, applicantCount: -1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Job.countDocuments(queryObj);
    const jobs = await Job.find(queryObj).sort(sortObj).skip(skip).limit(limitNum);

    res.json({
      jobs: jobs.map((j) => formatJob(j)),
      total,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single job by ID (with recruiter info)
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Increment view count
    job.views = (job.views || 0) + 1;
    await job.save();

    let recruiter = null;
    try {
      recruiter = await User.findById(job.recruiterId).select(
        "name avatar companyName companyLogo location phone website"
      );
    } catch (_) {}

    res.json({ job: formatJob(job, recruiter) });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Job not found" });
    }
    next(error);
  }
};

// @desc    Create a job posting
// @route   POST /api/jobs
// @access  Private (Recruiter authenticated — role: job)
const createJob = async (req, res, next) => {
  try {
    const {
      title,
      company,
      companyLogo,
      location,
      type,
      mode,
      industry,
      category,
      salaryMin,
      salaryMax,
      salaryLabel,
      description,
      responsibilities,
      skills,
      email,
      deadline,
      status,
      color,
    } = req.body;

    if (!title || !company || !location) {
      return res.status(400).json({
        message: "Please fill in all required fields (title, company, location)",
      });
    }

    const job = await Job.create({
      recruiterId: req.user._id,
      title: title.trim(),
      company: company.trim(),
      companyLogo: companyLogo || req.user.companyLogo || "",
      location: location.trim(),
      type: type || "Full-time",
      mode: mode || "On-site",
      industry: industry || "",
      category: category || "Engineering",
      salaryMin: salaryMin ? Number(salaryMin) : 0,
      salaryMax: salaryMax ? Number(salaryMax) : 0,
      salaryLabel: salaryLabel || "",
      description: description || "",
      responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
      skills: Array.isArray(skills) ? skills : [],
      email: email || req.user.email,
      deadline: deadline ? new Date(deadline) : null,
      status: status || "Open",
      color: color || "#4F46E5",
    });

    res.status(201).json({ job: formatJob(job) });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a job posting
// @route   PUT /api/jobs/:id
// @access  Private (Owner only)
const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this job" });
    }

    const {
      title, company, companyLogo, location, type, mode, industry, category,
      salaryMin, salaryMax, salaryLabel, description, responsibilities,
      skills, email, deadline, status, color,
    } = req.body;

    if (title !== undefined) job.title = title.trim();
    if (company !== undefined) job.company = company.trim();
    if (companyLogo !== undefined) job.companyLogo = companyLogo;
    if (location !== undefined) job.location = location.trim();
    if (type !== undefined) job.type = type;
    if (mode !== undefined) job.mode = mode;
    if (industry !== undefined) job.industry = industry;
    if (category !== undefined) job.category = category;
    if (salaryMin !== undefined) job.salaryMin = Number(salaryMin);
    if (salaryMax !== undefined) job.salaryMax = Number(salaryMax);
    if (salaryLabel !== undefined) job.salaryLabel = salaryLabel;
    if (description !== undefined) job.description = description;
    if (responsibilities !== undefined) job.responsibilities = Array.isArray(responsibilities) ? responsibilities : [];
    if (skills !== undefined) job.skills = Array.isArray(skills) ? skills : [];
    if (email !== undefined) job.email = email;
    if (deadline !== undefined) job.deadline = deadline ? new Date(deadline) : null;
    if (status !== undefined) job.status = status;
    if (color !== undefined) job.color = color;

    const updated = await job.save();
    res.json({ job: formatJob(updated) });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a job posting
// @route   DELETE /api/jobs/:id
// @access  Private (Owner only)
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this job" });
    }

    await Job.deleteOne({ _id: job._id });
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload job/company image to AWS S3
// @route   POST /api/jobs/upload-image
// @access  Private
const uploadJobImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const file = req.file;
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `jobs/${Date.now()}-${sanitized}`;

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
    console.error("S3 Upload error:", error);
    res.status(500).json({ message: `Upload failed: ${error.message}` });
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  uploadJobImage,
};
