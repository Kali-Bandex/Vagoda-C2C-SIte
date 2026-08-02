const { PutObjectCommand } = require("@aws-sdk/client-s3");
const Product = require("../models/Product");
const User = require("../models/User");
const { s3Client, bucketName } = require("../config/s3");

// Helper to transform Mongo document for client
const formatProduct = (p, seller = null) => ({
  id: p._id.toString(),
  sellerId: p.sellerId?.toString(),
  title: p.title,
  price: p.price,
  oldPrice: p.oldPrice,
  location: p.location,
  rating: p.rating,
  sold: p.sold,
  image: p.image,
  gallery: p.gallery && p.gallery.length > 0 ? p.gallery : [p.image],
  video: p.video || "",
  category: p.category,
  kind: p.kind || "product",
  description: p.description || "",
  sizes: p.sizes || [],
  colours: p.colours || [],
  specs: p.specs || [],
  seller: seller
    ? {
        id: seller._id.toString(),
        name: seller.name,
        avatar: seller.avatar,
        location: seller.location || p.location,
        phone: seller.phone || "0544324094",
      }
    : null,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

// @desc    Get all products with filtering, search, sorting and pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      location,
      search,
      topRated,
      sellerId,
      sort,
      page = 1,
      limit = 9,
    } = req.query;

    const queryObj = {};

    if (category && category !== "All") {
      queryObj.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      queryObj.price = {};
      if (minPrice !== undefined && minPrice !== "") queryObj.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && maxPrice !== "") queryObj.price.$lte = Number(maxPrice);
    }

    if (location && location.trim()) {
      queryObj.location = new RegExp(location.trim(), "i");
    }

    if (topRated === "true" || topRated === true) {
      queryObj.rating = { $gte: 4 };
    }

    if (sellerId) {
      queryObj.sellerId = sellerId;
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
    else if (sort === "Top Rated") sortObj = { rating: -1 };
    else if (sort === "Trending") sortObj = { sold: -1, rating: -1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(queryObj);
    const products = await Product.find(queryObj).sort(sortObj).skip(skip).limit(limitNum);

    res.json({
      products: products.map((p) => formatProduct(p)),
      total,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID (with seller info)
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Fetch seller info to show in Merchant section
    let seller = null;
    try {
      seller = await User.findById(product.sellerId).select("name avatar location phone");
    } catch (_) {}

    res.json({ product: formatProduct(product, seller) });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Product not found" });
    }
    next(error);
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Seller authenticated)
const createProduct = async (req, res, next) => {
  try {
    const {
      title, category, price, location, description,
      image, gallery, video, oldPrice, kind,
      sizes, colours, specs,
    } = req.body;

    if (!title || !price || !location || !image) {
      return res.status(400).json({
        message: "Please fill in all required fields (title, price, location, image)",
      });
    }

    const product = await Product.create({
      sellerId: req.user._id,
      title: title.trim(),
      category: category || "Electronic",
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : undefined,
      location: location.trim(),
      description: description || "",
      image,
      gallery: Array.isArray(gallery) && gallery.length > 0 ? gallery : [image],
      video: video || "",
      kind: kind || "product",
      sizes: Array.isArray(sizes) ? sizes : [],
      colours: Array.isArray(colours) ? colours : [],
      specs: Array.isArray(specs) ? specs : [],
    });

    res.status(201).json({ product: formatProduct(product) });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Owner only)
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this product" });
    }

    const {
      title, category, price, location, description,
      image, gallery, video, oldPrice, kind,
      sizes, colours, specs,
    } = req.body;

    if (title !== undefined) product.title = title.trim();
    if (category !== undefined) product.category = category;
    if (price !== undefined) product.price = Number(price);
    if (oldPrice !== undefined) product.oldPrice = oldPrice ? Number(oldPrice) : undefined;
    if (location !== undefined) product.location = location.trim();
    if (description !== undefined) product.description = description;
    if (image !== undefined) product.image = image;
    if (gallery !== undefined) product.gallery = Array.isArray(gallery) ? gallery : product.gallery;
    if (video !== undefined) product.video = video;
    if (kind !== undefined) product.kind = kind;
    if (sizes !== undefined) product.sizes = Array.isArray(sizes) ? sizes : [];
    if (colours !== undefined) product.colours = Array.isArray(colours) ? colours : [];
    if (specs !== undefined) product.specs = Array.isArray(specs) ? specs : [];

    const updatedProduct = await product.save();
    res.json({ product: formatProduct(updatedProduct) });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Owner only)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this product" });
    }

    await Product.deleteOne({ _id: product._id });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload product image to AWS S3 bucket
// @route   POST /api/products/upload-image
// @access  Private
const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const file = req.file;
    const sanitizeFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `products/${Date.now()}-${sanitizeFilename}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    const region = process.env.AWS_REGION || "eu-north-1";
    const imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    res.json({ url: imageUrl, key });
  } catch (error) {
    console.error("S3 Upload error:", error);
    res.status(500).json({ message: `Image upload failed: ${error.message}` });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
};
