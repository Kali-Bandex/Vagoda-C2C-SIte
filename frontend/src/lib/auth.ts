import { create } from "zustand";
import { api, setAccessToken, getAccessToken } from "./api";

export type Role = "buyer" | "product" | "job" | "service";

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  avatar: string;
  companyName?: string;
  companyLogo?: string;
  bio?: string;
  location?: string;
  website?: string;
};

export type Session = User;

const RAW_ROLE_META: Record<
  Role,
  { label: string; dashboard: string; listing: string; listings: string; activity: string }
> = {
  buyer: {
    label: "Marketplace buyer",
    dashboard: "Buyer Dashboard",
    listing: "Purchase",
    listings: "My Orders & Tracking",
    activity: "Saved Items",
  },
  product: {
    label: "Marketplace seller",
    dashboard: "Product Dashboard",
    listing: "Product",
    listings: "Products",
    activity: "Orders",
  },
  job: {
    label: "Job recruiter",
    dashboard: "Job Dashboard",
    listing: "Job",
    listings: "Jobs",
    activity: "Applications",
  },
  service: {
    label: "Service provider",
    dashboard: "Service Dashboard",
    listing: "Service",
    listings: "Services",
    activity: "Bookings",
  },
};

export const ROLE_META: Record<
  string,
  { label: string; dashboard: string; listing: string; listings: string; activity: string }
> = new Proxy(RAW_ROLE_META, {
  get(target, prop: string) {
    if (prop in target) {
      return target[prop as Role];
    }
    return target.product;
  },
});

interface AuthState {
  user: User | null;
  ready: boolean;
  loading: boolean;
  error: string | null;
  signIn: (data: { email: string; password?: string; role?: Role }) => Promise<User>;
  signUp: (data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role?: Role;
    avatar?: string;
    companyName?: string;
    companyLogo?: string;
    bio?: string;
    location?: string;
    website?: string;
  }) => Promise<User>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  ready: false,
  loading: false,
  error: null,

  checkAuth: async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        try {
          const res = await api.post("/auth/refresh");
          const { accessToken, user } = res.data;
          setAccessToken(accessToken);
          set({ user, ready: true });
          return;
        } catch {
          set({ user: null, ready: true });
          return;
        }
      }
      const res = await api.get("/auth/me");
      set({ user: res.data.user, ready: true });
    } catch {
      setAccessToken(null);
      set({ user: null, ready: true });
    }
  },

  signIn: async ({ email, password, role }) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/auth/login", {
        email,
        password: password || "Password123!",
      });
      const { user, accessToken } = res.data;
      if (role && user.role !== role) {
        user.role = role;
      }
      setAccessToken(accessToken);
      set({ user, ready: true, loading: false });
      return user;
    } catch (err: any) {
      const message = err.response?.data?.message || "Invalid credentials";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  signUp: async ({ name, email, password, phone, role, avatar, companyName, companyLogo, bio, location, website }) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/auth/signup", {
        name,
        email,
        password: password || "Password123!",
        phone: phone || "",
        role: role || "product",
        avatar: avatar || "",
        companyName: companyName || "",
        companyLogo: companyLogo || "",
        bio: bio || "",
        location: location || "",
        website: website || "",
      });
      const { user, accessToken } = res.data;
      setAccessToken(accessToken);
      set({ user, ready: true, loading: false });
      return user;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to create account";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  updateProfile: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.patch("/auth/profile", data);
      const updatedUser = res.data.user;
      set({ user: updatedUser, loading: false });
      return updatedUser;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to update profile";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  signOut: async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      setAccessToken(null);
      set({ user: null, ready: true });
    }
  },
}));

// Compatibility Hook wrapping Zustand store
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const ready = useAuthStore((state) => state.ready);
  const signInStore = useAuthStore((state) => state.signIn);
  const signUpStore = useAuthStore((state) => state.signUp);
  const signOutStore = useAuthStore((state) => state.signOut);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  return {
    session: user ? { ...user, role: user.role || "product" } : null,
    ready,
    signIn: (data: { name?: string; email: string; password?: string; phone?: string; role: Role }) => {
      if (data.name) {
        return signUpStore({ name: data.name, email: data.email, password: data.password, phone: data.phone, role: data.role });
      }
      return signInStore({ email: data.email, password: data.password, role: data.role });
    },
    signUp: signUpStore,
    signOut: signOutStore,
    checkAuth,
    updateProfile,
  };
}
