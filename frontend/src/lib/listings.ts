import { useCallback, useEffect, useState } from "react";
import { SERVICES, JOBS } from "@/lib/data";
import { useAuth, type Role } from "@/lib/auth";
import { useProductStore } from "./productStore";
import { useJobStore } from "./jobStore";
import { useServiceStore } from "./serviceStore";

export type Listing = {
  id: string;
  role: Role;
  title: string;
  price: number;
  location: string;
  category: string;
  image: string;
  description: string;
  rating: number;
  sold: number;
};

export type Activity = {
  id: string;
  person: string;
  listing: string;
  qty: string;
  status: "Done" | "Pending" | "Cancelled" | "Shipped" | "In Transit" | "Delivered" | "Processing";
  date: string;
  avatar: string;
};

const KEY = "vagoda-listings";

function seedNonProduct(): Listing[] {
  const services: Listing[] = SERVICES.slice(0, 6).map((s) => ({
    id: s.id,
    role: "service",
    title: s.title,
    price: s.price,
    location: s.location,
    category: s.category,
    image: s.image,
    description: s.description,
    rating: s.rating,
    sold: s.sold,
  }));
  const jobs: Listing[] = JOBS.slice(0, 6).map((j) => ({
    id: j.id,
    role: "job",
    title: j.title,
    price: 135,
    location: j.location,
    category: j.tag,
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
    description: j.description,
    rating: 4.8,
    sold: 1235,
  }));
  return [...services, ...jobs];
}

let mockMemory: Listing[] = [];
let mockLoaded = false;
const mockListeners = new Set<() => void>();

function readMock(): Listing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seedNonProduct();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as Listing[];
  } catch {
    return seedNonProduct();
  }
}

function writeMock(next: Listing[]) {
  mockMemory = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  mockListeners.forEach((l) => l());
}

export function useListings(role: Role) {
  const { session } = useAuth();
  const sellerProducts = useProductStore((state) => state.sellerProducts);
  const fetchSellerProducts = useProductStore((state) => state.fetchSellerProducts);
  const createProductStore = useProductStore((state) => state.createProduct);
  const updateProductStore = useProductStore((state) => state.updateProduct);
  const deleteProductStore = useProductStore((state) => state.deleteProduct);

  const [mockAll, setMockAll] = useState<Listing[]>(mockMemory);
  const [ready, setReady] = useState(
    role === "product" || role === "job" || role === "service" ? false : mockLoaded
  );

  // Job store connections
  const recruiterJobs = useJobStore((state) => state.recruiterJobs);
  const fetchRecruiterJobs = useJobStore((state) => state.fetchRecruiterJobs);
  const createJobStore = useJobStore((state) => state.createJob);
  const updateJobStore = useJobStore((state) => state.updateJob);
  const deleteJobStore = useJobStore((state) => state.deleteJob);

  // Service store connections
  const providerServices = useServiceStore((state) => state.providerServices);
  const fetchProviderServices = useServiceStore((state) => state.fetchProviderServices);
  const createServiceStore = useServiceStore((state) => state.createService);
  const updateServiceStore = useServiceStore((state) => state.updateService);
  const deleteServiceStore = useServiceStore((state) => state.deleteService);

  useEffect(() => {
    if (role === "product") {
      fetchSellerProducts(session?.id).then(() => setReady(true));
    } else if (role === "job") {
      fetchRecruiterJobs(session?.id).then(() => setReady(true));
    } else if (role === "service") {
      fetchProviderServices(session?.id).then(() => setReady(true));
    } else {
      mockMemory = readMock();
      mockLoaded = true;
      setMockAll(mockMemory);
      setReady(true);
      const listener = () => setMockAll([...mockMemory]);
      mockListeners.add(listener);
      return () => void mockListeners.delete(listener);
    }
  }, [role, session?.id, fetchSellerProducts, fetchRecruiterJobs, fetchProviderServices]);

  const create = useCallback(
    async (data: Omit<Listing, "id" | "rating" | "sold">) => {
      if (role === "product") {
        return await createProductStore(data);
      } else if (role === "job") {
        return (await createJobStore(data as any)) as unknown as Listing;
      } else if (role === "service") {
        return (await createServiceStore(data as any)) as unknown as Listing;
      } else {
        const item: Listing = { ...data, id: `n${Date.now()}`, rating: 5, sold: 0 };
        writeMock([item, ...mockMemory]);
        return item;
      }
    },
    [role, createProductStore, createJobStore, createServiceStore]
  );

  const update = useCallback(
    async (id: string, patch: Partial<Listing>) => {
      if (role === "product") {
        return await updateProductStore(id, patch);
      } else if (role === "job") {
        return (await updateJobStore(id, patch as any)) as unknown as void;
      } else if (role === "service") {
        return (await updateServiceStore(id, patch as any)) as unknown as void;
      } else {
        writeMock(mockMemory.map((l) => (l.id === id ? { ...l, ...patch } : l)));
      }
    },
    [role, updateProductStore, updateJobStore, updateServiceStore]
  );

  const remove = useCallback(
    async (id: string) => {
      if (role === "product") {
        await deleteProductStore(id);
      } else if (role === "job") {
        await deleteJobStore(id);
      } else if (role === "service") {
        await deleteServiceStore(id);
      } else {
        writeMock(mockMemory.filter((l) => l.id !== id));
      }
    },
    [role, deleteProductStore, deleteJobStore, deleteServiceStore]
  );

  // Map recruiterJobs → Listing shape
  const jobListings: Listing[] = recruiterJobs.map((j) => ({
    id: j.id,
    role: "job" as Role,
    title: j.title,
    price: j.salaryMin || 0,
    location: j.location,
    category: j.category,
    image:
      j.companyLogo ||
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
    description: j.description,
    rating: 4.8,
    sold: j.applicantCount || 0,
  }));

  // Map providerServices → Listing shape
  const serviceListings: Listing[] = providerServices.map((s) => ({
    id: s.id,
    role: "service" as Role,
    title: s.title,
    price: s.price,
    location: s.location,
    category: s.category,
    image: s.image,
    description: s.description,
    rating: s.rating || 5.0,
    sold: s.bookingsCount || 0,
  }));

  const items =
    role === "product"
      ? sellerProducts
      : role === "job"
      ? jobListings
      : role === "service"
      ? serviceListings
      : mockAll.filter((l) => l.role === role);

  const all =
    role === "product"
      ? sellerProducts
      : role === "job"
      ? jobListings
      : role === "service"
      ? serviceListings
      : mockAll;

  return { items, all, ready, create, update, remove };
}

const PEOPLE = [
  { name: "Eleanor Pena", avatar: "https://i.pravatar.cc/80?img=32" },
  { name: "Wade Warren", avatar: "https://i.pravatar.cc/80?img=13" },
  { name: "Jenny Wilson", avatar: "https://i.pravatar.cc/80?img=45" },
  { name: "Robert Fox", avatar: "https://i.pravatar.cc/80?img=52" },
  { name: "Kristin Watson", avatar: "https://i.pravatar.cc/80?img=25" },
  { name: "Cody Fisher", avatar: "https://i.pravatar.cc/80?img=60" },
];

const STATUSES: Activity["status"][] = ["Done", "Pending", "Cancelled", "Done", "Pending", "Done"];

export function activityFor(items: Listing[]): Activity[] {
  return PEOPLE.map((p, i) => ({
    id: `#78126${50 + i}`,
    person: p.name,
    avatar: p.avatar,
    listing: items[i % Math.max(items.length, 1)]?.title ?? "Ripped Jeans",
    qty: `${(i % 3) + 1} pc`,
    status: STATUSES[i],
    date: `${8 + i} July 2026`,
  }));
}

export const CHART_DATA = [
  600, 720, 780, 700, 620, 900, 860, 700, 640, 620, 700, 820, 900, 880, 760, 700,
].map((v, i) => ({ day: (i + 1) * 2, value: v, compare: v - 60 + (i % 4) * 45 }));
