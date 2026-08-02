const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");

dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = require("./config/db");
const User = require("./models/User");
const Product = require("./models/Product");

const SEED_PRODUCTS = [
  {
    title: "Logitech G705 Gaming Mouse",
    price: 135,
    oldPrice: 162.99,
    location: "Accra, Ghana",
    rating: 4.8,
    sold: 1235,
    image: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80",
    category: "Electronic",
    kind: "product",
    description: "100% Bio-washed Cotton — makes the fabric extra soft & skin-friendly. Bio-washed, dyed and finished with eco-friendly dyes, this piece is made to last through every wear.",
  },
  {
    title: "Land Rover Defender 110",
    price: 85000,
    oldPrice: 92000,
    location: "Accra, Ghana",
    rating: 4.9,
    sold: 12,
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=80",
    category: "Vehicle",
    kind: "product",
    description: "Premium condition Land Rover Defender 110 with custom off-road package, leather interior and low mileage.",
  },
  {
    title: "Keychron Mechanical Keyboard",
    price: 110,
    oldPrice: 140,
    location: "Kumasi, Ghana",
    rating: 4.7,
    sold: 840,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80",
    category: "Electronic",
    kind: "product",
    description: "Wireless mechanical keyboard with RGB backlighting, hot-swappable switches and macOS/Windows compatibility.",
  },
  {
    title: "BMW M4 Competition",
    price: 78000,
    oldPrice: 84000,
    location: "Accra, Ghana",
    rating: 5.0,
    sold: 5,
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=900&q=80",
    category: "Vehicle",
    kind: "product",
    description: "Twin-turbo inline 6 engine, Isle of Man Green finish, carbon fiber package and M xDrive system.",
  },
  {
    title: "Executive Meeting Table Set",
    price: 450,
    oldPrice: 520,
    location: "Tema, Ghana",
    rating: 4.6,
    sold: 210,
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
    category: "Furniture",
    kind: "product",
    description: "Solid hardwood executive meeting room table with built-in cable management and matching ergonomic leather chairs.",
  },
  {
    title: 'Smart 4K Television 55"',
    price: 620,
    oldPrice: 750,
    location: "Takoradi, Ghana",
    rating: 4.8,
    sold: 340,
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=900&q=80",
    category: "Electronic",
    kind: "product",
    description: "Ultra HD 4K Smart TV with Dolby Vision, HDR10+, voice remote control and high refresh rate for gaming.",
  },
  {
    title: "Raven Hoodie with Black Colored Design",
    price: 65,
    oldPrice: 85,
    location: "Cape Coast, Ghana",
    rating: 4.7,
    sold: 950,
    image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=80",
    category: "Fashion",
    kind: "product",
    description: "Heavyweight fleece hoodie with custom minimalist artwork, relaxed fit and double-stitched durability.",
  },
  {
    title: "Xbox Wireless Gamepad",
    price: 75,
    oldPrice: 90,
    location: "Accra, Ghana",
    rating: 4.9,
    sold: 1420,
    image: "https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=900&q=80",
    category: "Gaming",
    kind: "product",
    description: "Ergonomic wireless controller with textured grip, hybrid D-pad and Bluetooth connection for Xbox and PC.",
  },
  {
    title: "Retro Runner Sneakers",
    price: 120,
    oldPrice: 150,
    location: "Kumasi, Ghana",
    rating: 4.8,
    sold: 680,
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=80",
    category: "Fashion",
    kind: "product",
    description: "Classic vintage style running shoes featuring breathable mesh, suede overlays and cushioned rubber sole.",
  },
];

const seedDB = async () => {
  try {
    await connectDB();

    console.log("Clearing existing products...");
    await Product.deleteMany({});

    let seller = await User.findOne({ email: "demo@vagoda.com" });
    if (!seller) {
      console.log("Creating default seed seller...");
      seller = await User.create({
        name: "Vagoda Official Seller",
        email: "demo@vagoda.com",
        password: "Password123!",
        role: "product",
        avatar: "https://i.pravatar.cc/160?img=12",
      });
    }

    const productsToInsert = SEED_PRODUCTS.map((p) => ({
      ...p,
      sellerId: seller._id,
      gallery: [p.image],
    }));

    await Product.insertMany(productsToInsert);
    console.log(`Successfully seeded ${productsToInsert.length} products to database!`);
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedDB();
