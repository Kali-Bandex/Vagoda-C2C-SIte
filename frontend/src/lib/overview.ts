import { useEffect, useState } from "react";
import { api } from "./api";

export type OverviewStats = {
  totalProducts: number;
  totalEarnings: number;
  totalOrders: number;
  totalRatings: number;
  avgRating: number;
};

export type ChartPoint = {
  day: string;   // month label e.g. "Jan"
  value: number;
  compare: number;
};

export type Transaction = {
  id: string;
  person: string;
  avatar: string;
  listing: string;
  price: number;
  qty: string;
  status: string; // widened: includes Shipped, Delivered, In Transit, Processing
  date: string;
};

type OverviewData = {
  stats: OverviewStats;
  chartData: ChartPoint[];
  recentTransactions: Transaction[];
  ready: boolean;
  error: string | null;
};

const DEFAULT_STATS: OverviewStats = {
  totalProducts: 0,
  totalEarnings: 0,
  totalOrders: 0,
  totalRatings: 0,
  avgRating: 0,
};

export function useOverview(): OverviewData {
  const [stats, setStats] = useState<OverviewStats>(DEFAULT_STATS);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchOverview = async () => {
      try {
        const res = await api.get("/overview");
        if (cancelled) return;
        setStats(res.data.stats ?? DEFAULT_STATS);
        setChartData(Array.isArray(res.data.chartData) ? res.data.chartData : []);
        setRecentTransactions(Array.isArray(res.data.recentTransactions) ? res.data.recentTransactions : []);
        setError(null);
      } catch (err: any) {
        if (cancelled) return;
        // 401 after refresh failure — still render graceful empty dashboard
        const status = err.response?.status;
        if (status === 401) {
          setStats(DEFAULT_STATS);
          setChartData([]);
          setRecentTransactions([]);
          setError(null); // don't show error — just show zeros
        } else {
          setError(err.response?.data?.message ?? "Failed to load overview data");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    fetchOverview();
    return () => { cancelled = true; };
  }, []);

  return { stats, chartData, recentTransactions, ready, error };
}
