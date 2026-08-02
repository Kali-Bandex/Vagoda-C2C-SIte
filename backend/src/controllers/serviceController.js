const { PutObjectCommand } = require("@aws-sdk/client-s3");
const Service = require("../models/Service");
const User = require("../models/User");
const { s3Client, bucketName } = require("../config/s3");

// Helper: transform Mongo document for client
const formatService = (s, provider = null) => ({
  id: s._id.toString(),
  providerId: s.providerId?.toString(),
  title: s.title,
  category: s.category,
  price: s.price,
  oldPrice: s.oldPrice || undefined,
  location: s.location,
  image: s.image,
  gallery: s.gallery && s.gallery.length > 0 ? s.gallery : [s.image],
  description: s.description,
  specs: s.specs || [],
  status: s.status || "Active",
  rating: s.rating || 5.0,
  reviewsCount: s.reviewsCount || 0,
  sold: s.bookingsCount || 0, // Compatible with frontend Product type `sold` property
  bookingsCount: s.bookingsCount || 0,
  views: s.views || 0,
  kind: "service",
  provider: provider
    ? {
        id: provider._id.toString(),
        name: provider.name,
        avatar: provider.avatar,
        companyName: provider.companyName || provider.name,
        companyLogo: provider.companyLogo || "",
        location: provider.location || s.location,
        phone: provider.phone || "",
        website: provider.website || "",
      }
    : null,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

// @desc    Get all services with filtering, search, sorting and pagination
// @route   GET /api/services
// @access  Public
const getServices = async (req, res, next) => {
  try {
    const {
      category,
      location,
      search,
      minPrice,
      maxPrice,
      providerId,
      status,
      sort,
      page = 1,
      limit = 9,
    } = req.query;

    const queryObj = {};

    if (providerId) {
      queryObj.providerId = providerId;
    } else {
      queryObj.status = status || "Active";
    }

    if (category && category !== "All") {
      queryObj.category = category;
    }

    if (location && location.trim()) {
      queryObj.location = new RegExp(location.trim(), "i");
    }

    if (minPrice !== undefined && minPrice !== "") {
      queryObj.price = { $gte: Number(minPrice) };
    }

    if (maxPrice !== undefined && maxPrice !== "") {
      queryObj.price = { ...queryObj.price, $lte: Number(maxPrice) };
    }

    if (search && search.trim()) {
      queryObj.$or = [
        { title: new RegExp(search.trim(), "i") },
        { description: new RegExp(search.trim(), "i") },
        { category: new RegExp(search.trim(), "i") },
      ];
    }

    let sortObj = { createdAt: -1 };
    if (sort === "Price: Low to High") sortObj = { price: 1 };
    else if (sort === "Price: High to Low") sortObj = { price: -1 };
    else if (sort === "Popular") sortObj = { bookingsCount: -1, rating: -1 };
    else if (sort === "Rating") sortObj = { rating: -1, reviewsCount: -1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Service.countDocuments(queryObj);
    const services = await Service.find(queryObj).sort(sortObj).skip(skip).limit(limitNum);

    res.json({
      services: services.map((s) => formatService(s)),
      total,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single service by ID (with provider info)
// @route   GET /api/services/:id
// @access  Public
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Increment view count
    service.views = (service.views || 0) + 1;
    await service.save();

    let provider = null;
    try {
      provider = await User.findById(service.providerId).select(
        "name avatar companyName companyLogo location phone website"
      );
    } catch (_) {}

    res.json({ service: formatService(service, provider) });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Service not found" });
    }
    next(error);
  }
};

// @desc    Create a service listing
// @route   POST /api/services
// @access  Private (Provider authenticated — role: service)
const createService = async (req, res, next) => {
  try {
    const {
      title,
      category,
      price,
      oldPrice,
      location,
      image,
      gallery,
      description,
      specs,
      status,
    } = req.body;

    if (!title || !category || !price || !location || !image || !description) {
      return res.status(400).json({
        message: "Please fill in all required fields (title, category, price, location, image, description)",
      });
    }

    const service = await Service.create({
      providerId: req.user._id,
      title: title.trim(),
      category: category.trim(),
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : 0,
      location: location.trim(),
      image: image.trim(),
      gallery: Array.isArray(gallery) && gallery.length > 0 ? gallery : [image.trim()],
      description: description.trim(),
      specs: Array.isArray(specs) ? specs : [],
      status: status || "Active",
    });

    res.status(201).json({ service: formatService(service) });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a service listing
// @route   PUT /api/services/:id
// @access  Private (Owner only)
const updateService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (service.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this service" });
    }

    const {
      title,
      category,
      price,
      oldPrice,
      location,
      image,
      gallery,
      description,
      specs,
      status,
    } = req.body;

    if (title !== undefined) service.title = title.trim();
    if (category !== undefined) service.category = category.trim();
    if (price !== undefined) service.price = Number(price);
    if (oldPrice !== undefined) service.oldPrice = Number(oldPrice);
    if (location !== undefined) service.location = location.trim();
    if (image !== undefined) service.image = image.trim();
    if (gallery !== undefined) service.gallery = Array.isArray(gallery) ? gallery : [];
    if (description !== undefined) service.description = description.trim();
    if (specs !== undefined) service.specs = Array.isArray(specs) ? specs : [];
    if (status !== undefined) service.status = status;

    const updated = await service.save();
    res.json({ service: formatService(updated) });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a service listing
// @route   DELETE /api/services/:id
// @access  Private (Owner only)
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (service.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this service" });
    }

    await Service.deleteOne({ _id: service._id });
    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload service image to S3
// @route   POST /api/services/upload-image
// @access  Private
const uploadServiceImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const file = req.file;
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `services/${Date.now()}-${sanitized}`;

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
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  uploadServiceImage,
};
