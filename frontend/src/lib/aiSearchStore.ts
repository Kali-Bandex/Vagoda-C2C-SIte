import { create } from "zustand";
import { api } from "./api";

export interface AiSearchResultItem {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  price?: number;
  oldPrice?: number;
  location?: string;
  category?: string;
  kind?: string;
  image?: string;
  gallery?: string[];
  company?: string;
  companyLogo?: string;
  type?: string;
  mode?: string;
  salaryLabel?: string;
  salaryMin?: number;
  salaryMax?: number;
  rating?: number;
  reviewsCount?: number;
  matchScore: number;
  matchReason?: string;
  skills?: string[];
  specs?: { key: string; value: string }[];
}

export interface AiSearchState {
  query: string;
  loading: boolean;
  error: string | null;
  aiSummary: string;
  intentCategory: string;
  keywords: string[];
  suggestedQueries: string[];
  products: AiSearchResultItem[];
  services: AiSearchResultItem[];
  jobs: AiSearchResultItem[];
  totalMatches: number;
  activeTab: "all" | "products" | "services" | "jobs";

  setQuery: (q: string) => void;
  setActiveTab: (tab: "all" | "products" | "services" | "jobs") => void;
  performAiSearch: (searchQuery?: string) => Promise<void>;
}

export const useAiSearchStore = create<AiSearchState>((set, get) => ({
  query: "",
  loading: false,
  error: null,
  aiSummary: "",
  intentCategory: "All",
  keywords: [],
  suggestedQueries: [
    "Wireless noise cancelling headphones",
    "Web developer for hire",
    "Ergonomic office desk set",
    "Logistics and courier services",
  ],
  products: [],
  services: [],
  jobs: [],
  totalMatches: 0,
  activeTab: "all",

  setQuery: (q: string) => set({ query: q }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  performAiSearch: async (searchQuery?: string) => {
    const q = searchQuery !== undefined ? searchQuery : get().query;
    set({ loading: true, error: null, query: q });

    try {
      const response = await api.post("/ai/search", { query: q });
      const data = response.data;

      if (data.success) {
        set({
          aiSummary: data.aiSummary || "",
          intentCategory: data.intent?.category || "All",
          keywords: data.intent?.keywords || [],
          suggestedQueries: data.suggestedQueries || [],
          products: data.results?.products || [],
          services: data.results?.services || [],
          jobs: data.results?.jobs || [],
          totalMatches: data.totalMatches || 0,
          loading: false,
        });
      } else {
        set({
          error: data.message || "Failed to perform AI search",
          loading: false,
        });
      }
    } catch (err: any) {
      console.error("AI Search Error:", err);
      set({
        error: err.response?.data?.message || err.message || "Error connecting to AI Search Service",
        loading: false,
      });
    }
  },
}));
