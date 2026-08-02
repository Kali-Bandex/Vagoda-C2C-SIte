import { create } from "zustand";
import { api } from "./api";

export interface LiveService {
  id: string;
  providerId?: string;
  title: string;
  category: string;
  price: number;
  oldPrice?: number;
  location: string;
  image: string;
  gallery: string[];
  description: string;
  specs: { key: string; value: string }[];
  status: "Active" | "Paused" | "Draft";
  rating: number;
  reviewsCount: number;
  sold: number;
  bookingsCount: number;
  views: number;
  kind: "service";
  provider?: {
    id: string;
    name: string;
    avatar?: string;
    companyName?: string;
    companyLogo?: string;
    location?: string;
    phone?: string;
    website?: string;
  } | null;
  createdAt?: string;
}

export interface ServiceFilters {
  search?: string;
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

interface ServiceStoreState {
  services: LiveService[];
  total: number;
  pages: number;
  loadingServices: boolean;

  currentService: LiveService | null;
  loadingService: boolean;

  providerServices: LiveService[];
  loadingProviderServices: boolean;

  fetchServices: (filters?: ServiceFilters) => Promise<void>;
  fetchServiceById: (id: string) => Promise<LiveService | null>;
  fetchProviderServices: (providerId?: string) => Promise<void>;
  createService: (data: Partial<LiveService>) => Promise<LiveService>;
  updateService: (id: string, data: Partial<LiveService>) => Promise<LiveService>;
  deleteService: (id: string) => Promise<void>;
  uploadServiceImage: (file: File) => Promise<string>;
}

export const useServiceStore = create<ServiceStoreState>((set, get) => ({
  services: [],
  total: 0,
  pages: 1,
  loadingServices: false,
  currentService: null,
  loadingService: false,
  providerServices: [],
  loadingProviderServices: false,

  fetchServices: async (filters = {}) => {
    set({ loadingServices: true });
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.category && filters.category !== "All") params.set("category", filters.category);
      if (filters.location) params.set("location", filters.location);
      if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
      if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
      if (filters.sort) params.set("sort", filters.sort);
      params.set("page", String(filters.page ?? 1));
      params.set("limit", String(filters.limit ?? 9));

      const res = await api.get(`/services?${params.toString()}`);
      set({
        services: res.data.services || [],
        total: res.data.total || 0,
        pages: res.data.pages || 1,
        loadingServices: false,
      });
    } catch {
      set({ services: [], loadingServices: false });
    }
  },

  fetchServiceById: async (id: string) => {
    set({ loadingService: true, currentService: null });
    try {
      const res = await api.get(`/services/${id}`);
      const service = res.data.service as LiveService;
      set({ currentService: service, loadingService: false });
      return service;
    } catch {
      set({ loadingService: false });
      return null;
    }
  },

  fetchProviderServices: async (providerId?: string) => {
    set({ loadingProviderServices: true });
    try {
      const params = new URLSearchParams();
      if (providerId) params.set("providerId", providerId);
      const res = await api.get(`/services?${params.toString()}&limit=100`);
      set({ providerServices: res.data.services || [], loadingProviderServices: false });
    } catch {
      set({ providerServices: [], loadingProviderServices: false });
    }
  },

  createService: async (data: Partial<LiveService>) => {
    const res = await api.post("/services", data);
    const service = res.data.service as LiveService;
    set((state) => ({ providerServices: [service, ...state.providerServices] }));
    return service;
  },

  updateService: async (id: string, data: Partial<LiveService>) => {
    const res = await api.put(`/services/${id}`, data);
    const service = res.data.service as LiveService;
    set((state) => ({
      providerServices: state.providerServices.map((s) => (s.id === id ? service : s)),
      currentService: state.currentService?.id === id ? service : state.currentService,
    }));
    return service;
  },

  deleteService: async (id: string) => {
    await api.delete(`/services/${id}`);
    set((state) => ({
      providerServices: state.providerServices.filter((s) => s.id !== id),
    }));
  },

  uploadServiceImage: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post("/services/upload-image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url as string;
  },
}));
