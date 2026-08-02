import { create } from "zustand";
import { api } from "./api";
import type { Product } from "./data";
import type { Listing } from "./listings";

interface FetchParams {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  topRated?: boolean;
  sellerId?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

interface ProductState {
  products: Product[];
  sellerProducts: Listing[];
  currentProduct: Product | null;
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  error: string | null;

  fetchProducts: (params?: FetchParams) => Promise<Product[]>;
  fetchProductById: (id: string) => Promise<Product | null>;
  fetchSellerProducts: (sellerId?: string) => Promise<Listing[]>;
  createProduct: (data: Omit<Listing, "id" | "rating" | "sold">) => Promise<Listing>;
  updateProduct: (id: string, patch: Partial<Listing>) => Promise<Listing>;
  deleteProduct: (id: string) => Promise<void>;
  uploadImage: (file: File) => Promise<string>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  sellerProducts: [],
  currentProduct: null,
  total: 0,
  page: 1,
  pages: 1,
  loading: false,
  error: null,

  fetchProducts: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get("/products", { params });
      const products = Array.isArray(res.data?.products) ? res.data.products : [];
      const total = res.data?.total ?? 0;
      const page = res.data?.page ?? 1;
      const pages = res.data?.pages ?? 1;
      set({ products, total, page, pages, loading: false });
      return products;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to fetch products";
      set({ error: msg, loading: false });
      return [];
    }
  },

  fetchProductById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/products/${id}`);
      const product = res.data?.product ?? null;
      set({ currentProduct: product, loading: false });
      return product;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to fetch product detail";
      set({ error: msg, loading: false, currentProduct: null });
      return null;
    }
  },

  fetchSellerProducts: async (sellerId?: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get("/products", {
        params: { sellerId, limit: 100 },
      });
      const rawProducts = Array.isArray(res.data?.products) ? res.data.products : [];
      const listings: Listing[] = rawProducts.map((p: Product) => ({
        id: p.id,
        role: "product",
        title: p.title,
        price: p.price,
        location: p.location,
        category: p.category,
        image: p.image,
        description: p.description,
        rating: p.rating,
        sold: p.sold,
      }));
      set({ sellerProducts: listings, loading: false });
      return listings;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to fetch seller products";
      set({ error: msg, loading: false });
      return [];
    }
  },

  createProduct: async (data) => {
    set({ loading: true, error: null });
    try {
      const d = data as any;
      const res = await api.post("/products", {
        title: data.title,
        price: data.price,
        location: data.location,
        category: data.category,
        image: data.image,
        description: data.description,
        kind: d.kind || "product",
        gallery: d.gallery ?? [data.image],
        video: d.video ?? "",
        sizes: d.sizes ?? [],
        colours: d.colours ?? [],
        specs: d.specs ?? [],
      });
      const p = res.data.product;
      const listing: Listing = {
        id: p.id,
        role: "product",
        title: p.title,
        price: p.price,
        location: p.location,
        category: p.category,
        image: p.image,
        description: p.description,
        rating: p.rating,
        sold: p.sold,
      };

      set((state) => ({
        sellerProducts: [listing, ...state.sellerProducts],
        products: [p, ...state.products],
        loading: false,
      }));

      return listing;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to create product";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  updateProduct: async (id, patch) => {
    set({ loading: true, error: null });
    try {
      const res = await api.put(`/products/${id}`, patch);
      const p = res.data.product;
      const listing: Listing = {
        id: p.id,
        role: "product",
        title: p.title,
        price: p.price,
        location: p.location,
        category: p.category,
        image: p.image,
        description: p.description,
        rating: p.rating,
        sold: p.sold,
      };

      set((state) => ({
        sellerProducts: state.sellerProducts.map((item) => (item.id === id ? listing : item)),
        products: state.products.map((item) => (item.id === id ? p : item)),
        loading: false,
      }));

      return listing;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update product";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  deleteProduct: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/products/${id}`);
      set((state) => ({
        sellerProducts: state.sellerProducts.filter((item) => item.id !== id),
        products: state.products.filter((item) => item.id !== id),
        loading: false,
      }));
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to delete product";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/products/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.url;
  },
}));
