import { create } from "zustand";
import { api } from "./api";

export interface LiveJob {
  id: string;
  recruiterId?: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract" | "Remote" | "Internship";
  mode: "On-site" | "Remote" | "Hybrid";
  industry: string;
  category: string;
  salaryMin: number;
  salaryMax: number;
  salaryLabel: string;
  salary: string; // computed backwards-compat string
  description: string;
  responsibilities: string[];
  skills: string[];
  email: string;
  deadline: string | null;
  status: "Open" | "Closed" | "Draft";
  views: number;
  applicantCount: number;
  color: string;
  posted: string;
  studio: string;
  tag: string;
  recruiter?: {
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

export interface JobFilters {
  search?: string;
  category?: string;
  type?: string;
  mode?: string;
  location?: string;
  minSalary?: number;
  maxSalary?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

interface JobStoreState {
  // Public listing
  jobs: LiveJob[];
  total: number;
  pages: number;
  loadingJobs: boolean;

  // Single job detail
  currentJob: LiveJob | null;
  loadingJob: boolean;

  // Recruiter's own postings
  recruiterJobs: LiveJob[];
  loadingRecruiterJobs: boolean;

  fetchJobs: (filters?: JobFilters) => Promise<void>;
  fetchJobById: (id: string) => Promise<LiveJob | null>;
  fetchRecruiterJobs: (recruiterId?: string) => Promise<void>;
  createJob: (data: Partial<LiveJob>) => Promise<LiveJob>;
  updateJob: (id: string, data: Partial<LiveJob>) => Promise<LiveJob>;
  deleteJob: (id: string) => Promise<void>;
  uploadJobImage: (file: File) => Promise<string>;
}

export const useJobStore = create<JobStoreState>((set, get) => ({
  jobs: [],
  total: 0,
  pages: 1,
  loadingJobs: false,
  currentJob: null,
  loadingJob: false,
  recruiterJobs: [],
  loadingRecruiterJobs: false,

  fetchJobs: async (filters = {}) => {
    set({ loadingJobs: true });
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.category && filters.category !== "All") params.set("category", filters.category);
      if (filters.type && filters.type !== "All") params.set("type", filters.type);
      if (filters.mode && filters.mode !== "All") params.set("mode", filters.mode);
      if (filters.location) params.set("location", filters.location);
      if (filters.minSalary) params.set("minSalary", String(filters.minSalary));
      if (filters.maxSalary) params.set("maxSalary", String(filters.maxSalary));
      if (filters.sort) params.set("sort", filters.sort);
      params.set("page", String(filters.page ?? 1));
      params.set("limit", String(filters.limit ?? 9));

      const res = await api.get(`/jobs?${params.toString()}`);
      set({
        jobs: res.data.jobs || [],
        total: res.data.total || 0,
        pages: res.data.pages || 1,
        loadingJobs: false,
      });
    } catch {
      set({ jobs: [], loadingJobs: false });
    }
  },

  fetchJobById: async (id: string) => {
    set({ loadingJob: true, currentJob: null });
    try {
      const res = await api.get(`/jobs/${id}`);
      const job = res.data.job as LiveJob;
      set({ currentJob: job, loadingJob: false });
      return job;
    } catch {
      set({ loadingJob: false });
      return null;
    }
  },

  fetchRecruiterJobs: async (recruiterId?: string) => {
    set({ loadingRecruiterJobs: true });
    try {
      const params = new URLSearchParams();
      if (recruiterId) params.set("recruiterId", recruiterId);
      // Fetch all statuses for the recruiter's own view
      const res = await api.get(`/jobs?${params.toString()}&limit=100`);
      set({ recruiterJobs: res.data.jobs || [], loadingRecruiterJobs: false });
    } catch {
      set({ recruiterJobs: [], loadingRecruiterJobs: false });
    }
  },

  createJob: async (data: Partial<LiveJob>) => {
    const res = await api.post("/jobs", data);
    const job = res.data.job as LiveJob;
    set((state) => ({ recruiterJobs: [job, ...state.recruiterJobs] }));
    return job;
  },

  updateJob: async (id: string, data: Partial<LiveJob>) => {
    const res = await api.put(`/jobs/${id}`, data);
    const job = res.data.job as LiveJob;
    set((state) => ({
      recruiterJobs: state.recruiterJobs.map((j) => (j.id === id ? job : j)),
      currentJob: state.currentJob?.id === id ? job : state.currentJob,
    }));
    return job;
  },

  deleteJob: async (id: string) => {
    await api.delete(`/jobs/${id}`);
    set((state) => ({
      recruiterJobs: state.recruiterJobs.filter((j) => j.id !== id),
    }));
  },

  uploadJobImage: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post("/jobs/upload-image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url as string;
  },
}));
