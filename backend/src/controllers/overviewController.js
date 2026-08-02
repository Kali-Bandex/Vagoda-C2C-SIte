const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Service = require("../models/Service");
const Booking = require("../models/Booking");

// @desc    Get user overview stats, chart data, and recent transactions (Real DB data for Buyer or Seller)
// @route   GET /api/overview
// @access  Private
const getOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const isBuyer = req.user.role === "buyer";

    if (isBuyer) {
      // ── Real Buyer Overview from Mongo DB Orders ────────────────────────────
      const orders = await Order.find({ buyerId: userId })
        .populate("sellerId", "name avatar")
        .sort({ createdAt: -1 })
        .lean();

      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const deliveredCount = orders.filter((o) => o.status === "Delivered").length;
      const pendingCount = orders.filter(
        (o) => o.status !== "Delivered" && o.status !== "Cancelled"
      ).length;

      const stats = {
        totalProducts: totalOrders, // Total Purchases
        totalEarnings: totalSpent, // Total Spent
        totalOrders: pendingCount, // Active/Pending Orders
        totalRatings: deliveredCount, // Completed Deliveries
        avgRating: 5.0,
      };

      // Calculate monthly spending chart from real orders
      const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const now = new Date();
      const chartData = [];
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        const mIndex = d.getMonth();
        const y = d.getFullYear();

        const monthOrders = orders.filter((o) => {
          const oDate = new Date(o.createdAt);
          return oDate.getMonth() === mIndex && oDate.getFullYear() === y;
        });

        const monthSpent = monthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        chartData.push({
          day: MONTH_LABELS[mIndex],
          value: monthSpent,
          compare: Math.max(0, Math.round(monthSpent * 0.8)),
        });
      }

      const recentTransactions = orders.slice(0, 6).map((o) => ({
        id: o.orderNumber,
        person: o.sellerId?.name || "Vagoda Seller",
        avatar: o.sellerId?.avatar || "https://i.pravatar.cc/80?img=12",
        listing: o.items.map((i) => i.title).join(", ") || "Purchased item",
        price: o.totalAmount,
        qty: `${o.items.reduce((s, i) => s + (i.qty || 1), 0)} pc`,
        status: o.status,
        date: o.createdAt
          ? new Date(o.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "—",
      }));

      return res.json({ stats, chartData, recentTransactions });
    }

    // ── Real Job Recruiter Overview ──────────────────────────────────────────
    if (req.user.role === "job") {
      const recruiterJobs = await Job.find({ recruiterId: userId }).lean();
      const jobIds = recruiterJobs.map((j) => j._id);

      const allApplications = await Application.find({ recruiterId: userId })
        .populate("applicantId", "name avatar")
        .populate("jobId", "title company")
        .sort({ createdAt: -1 })
        .lean();

      const totalJobs = recruiterJobs.length;
      const totalApplications = allApplications.length;
      const totalHired = allApplications.filter((a) => a.status === "Hired").length;
      const totalViews = recruiterJobs.reduce((s, j) => s + (j.views || 0), 0);

      const stats = {
        totalProducts: totalJobs,          // Total Jobs Posted
        totalEarnings: totalApplications,  // Total Applications (shown as earnings slot)
        totalOrders: totalHired,           // Total Hired
        totalRatings: totalViews,          // Total Views
        avgRating: 5.0,
      };

      const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const now = new Date();
      const chartData = [];
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        const mIndex = d.getMonth();
        const y = d.getFullYear();
        const monthApps = allApplications.filter((a) => {
          const aDate = new Date(a.createdAt);
          return aDate.getMonth() === mIndex && aDate.getFullYear() === y;
        });
        chartData.push({
          day: MONTH_LABELS[mIndex],
          value: monthApps.length,
          compare: Math.max(0, Math.round(monthApps.length * 0.8)),
        });
      }

      const recentTransactions = allApplications.slice(0, 6).map((a) => ({
        id: a.applicationNumber,
        person: a.applicantId?.name || a.name || "Applicant",
        avatar: a.applicantId?.avatar || "https://i.pravatar.cc/80?img=12",
        listing: a.jobId?.title || "Job Application",
        price: 0,
        qty: "1 app",
        status: a.status,
        date: a.createdAt
          ? new Date(a.createdAt).toLocaleDateString("en-GB", {
              day: "numeric", month: "short", year: "numeric",
            })
          : "—",
      }));

      return res.json({ stats, chartData, recentTransactions });
    }

    // ── Real Service Provider Overview ────────────────────────────────────────
    if (req.user.role === "service") {
      const providerServices = await Service.find({ providerId: userId }).lean();
      const allBookings = await Booking.find({ providerId: userId })
        .populate("customerId", "name avatar")
        .populate("serviceId", "title category price")
        .sort({ createdAt: -1 })
        .lean();

      const totalServices = providerServices.length;
      const completedBookings = allBookings.filter((b) => b.status === "Completed");
      const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const totalBookingsCount = allBookings.length;
      const totalViews = providerServices.reduce((s, sv) => s + (sv.views || 0), 0);

      const stats = {
        totalProducts: totalServices,          // Total Services Listed
        totalEarnings,                         // Total Earnings ($)
        totalOrders: totalBookingsCount,        // Total Bookings Received
        totalRatings: totalViews,              // Total Service Views
        avgRating: 5.0,
      };

      const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const now = new Date();
      const chartData = [];
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        const mIndex = d.getMonth();
        const y = d.getFullYear();
        const monthBookings = allBookings.filter((b) => {
          const bDate = new Date(b.createdAt);
          return bDate.getMonth() === mIndex && bDate.getFullYear() === y;
        });
        const monthVal = monthBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        chartData.push({
          day: MONTH_LABELS[mIndex],
          value: monthVal,
          compare: Math.max(0, Math.round(monthVal * 0.8)),
        });
      }

      const recentTransactions = allBookings.slice(0, 6).map((b) => ({
        id: b.bookingNumber,
        person: b.customerId?.name || b.customerName || "Customer",
        avatar: b.customerId?.avatar || "https://i.pravatar.cc/80?img=15",
        listing: b.serviceId?.title || "Service Booking",
        price: b.totalAmount || 0,
        qty: "1 booking",
        status: b.status,
        date: b.createdAt
          ? new Date(b.createdAt).toLocaleDateString("en-GB", {
              day: "numeric", month: "short", year: "numeric",
            })
          : "—",
      }));

      return res.json({ stats, chartData, recentTransactions });
    }

    // ── Real Seller Overview from Mongo DB Orders & Products ─────────────────

    const sellerOrders = await Order.find({ sellerId: userId })
      .populate("buyerId", "name avatar")
      .sort({ createdAt: -1 })
      .lean();

    const sellerProducts = await Product.find({ sellerId: userId });

    const totalProductsCount = sellerProducts.length;
    const totalEarnings = sellerOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrdersCount = sellerOrders.length;
    const deliveredCount = sellerOrders.filter((o) => o.status === "Delivered").length;

    const stats = {
      totalProducts: totalProductsCount,
      totalEarnings,
      totalOrders: totalOrdersCount,
      totalRatings: deliveredCount,
      avgRating: 5.0,
    };

    const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const chartData = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const mIndex = d.getMonth();
      const y = d.getFullYear();

      const monthOrders = sellerOrders.filter((o) => {
        const oDate = new Date(o.createdAt);
        return oDate.getMonth() === mIndex && oDate.getFullYear() === y;
      });

      const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      chartData.push({
        day: MONTH_LABELS[mIndex],
        value: monthRevenue,
        compare: Math.max(0, Math.round(monthRevenue * 0.85)),
      });
    }

    const recentTransactions = sellerOrders.slice(0, 6).map((o) => ({
      id: o.orderNumber,
      person: o.buyerId?.name || "Customer",
      avatar: o.buyerId?.avatar || "https://i.pravatar.cc/80?img=12",
      listing: o.items.map((i) => i.title).join(", ") || "Ordered product",
      price: o.totalAmount,
      qty: `${o.items.reduce((s, i) => s + (i.qty || 1), 0)} pc`,
      status: o.status,
      date: o.createdAt
        ? new Date(o.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "—",
    }));

    res.json({ stats, chartData, recentTransactions });
  } catch (error) {
    next(error);
  }
};

module.exports = { getOverview };
