export type Product = {
  id: string;
  sellerId?: string;
  title: string;
  price: number;
  oldPrice?: number;
  location: string;
  rating: number;
  sold: number;
  image: string;
  gallery: string[];
  video?: string;
  category: string;
  kind: "product" | "service";
  description: string;
  sizes?: string[];
  colours?: string[];
  specs?: { key: string; value: string }[];
  seller?: {
    id: string;
    name: string;
    avatar?: string;
    location?: string;
    phone?: string;
  } | null;
};

const img = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const IMAGES = {
  welder: img("photo-1504328345606-18bbc8c9d7d1"),
  electrician: img("photo-1621905251189-08b45d6a269e"),
  ac: img("photo-1581092160562-40aa08e78837"),
  mechanic: img("photo-1486262715619-67b85e0b08d3"),
  laptopRepair: img("photo-1517336714731-489689fd1ca8"),
  reception: img("photo-1566073771259-6a8506099945"),
  resort: img("photo-1571003123894-1f0594d2b5d9"),
  hotel: img("photo-1611892440504-42a792e24d32"),
  mouse: img("photo-1527814050087-3793815479db"),
};

const base = {
  price: 135,
  oldPrice: 162.99,
  location: "Accra, Ghana",
  rating: 4.8,
  sold: 1235,
};

function makeService(
  id: string,
  title: string,
  image: string,
  category: string,
): Product {
  return {
    id,
    title,
    ...base,
    image,
    gallery: [image, IMAGES.hotel, IMAGES.resort],
    category,
    kind: "service",
    description:
      "Professional service provision guaranteed with certified experts across Ghana.",
  };
}

export const CATEGORIES = ["Electronic", "Fashion", "Vehicle", "Home", "Gaming", "Furniture"];

export const SERVICES: Product[] = [
  makeService("s1", "Professional Welding Service", IMAGES.welder, "Electronic"),
  makeService("s2", "Luxury Hotel Room Booking", IMAGES.hotel, "Home"),
  makeService("s3", "Certified Electrical Installation", IMAGES.electrician, "Home"),
  makeService("s4", "Car Detailing & Body Work", IMAGES.mechanic, "Vehicle"),
  makeService("s5", "Front Desk & Reception Staffing", IMAGES.reception, "Home"),
  makeService("s6", "Laptop & Macbook Repair", IMAGES.laptopRepair, "Electronic"),
  makeService("s7", "Air Conditioner Installation", IMAGES.ac, "Home"),
  makeService("s8", "Gaming Peripheral Setup", IMAGES.mouse, "Gaming"),
  makeService("s9", "Resort Stay & Poolside Suite", IMAGES.resort, "Home"),
];

export type Job = {
  id: string;
  title: string;
  company: string;
  studio: string;
  location: string;
  posted: string;
  color: string;
  description: string;
  type: string;
  mode: string;
  tag: string;
  salary: string;
  industry: string;
  email: string;
};

const jobColors = ["#EFC94C", "#4ADE80", "#4F46E5", "#F97316", "#EAB308", "#D9F99D"];

export const JOBS: Job[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `j${i + 1}`,
  title: i % 2 === 0 ? "Senior Graphic Designer" : "Senior Frontend Developer",
  company: "Creative Labs",
  studio: "Design Studio in Accra, GH",
  location: "Cape Coast, Ghana",
  posted: "2h",
  color: jobColors[i % jobColors.length],
  description:
    "Join our dynamic team to lead the design process for a range of client projects, from branding to c...",
  type: "Full-time",
  mode: "On-site",
  tag: "Design",
  salary: "$135,700",
  industry: "Software and hardware",
  email: "jobs@microsoft.com",
}));

export const BRANDS = [
  "NCR",
  "monday.com",
  "Disney",
  "Dropbox",
  "Rakuten",
  "NCR",
  "monday.com",
  "Disney",
];

export function findJob(id: string) {
  return JOBS.find((j) => j.id === id);
}
