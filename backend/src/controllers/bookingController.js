const Booking = require("../models/Booking");
const Service = require("../models/Service");
const Notification = require("../models/Notification");

// Generate unique booking number
function generateBookingNumber() {
  return `BK-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

// Helper: format booking object for client
const formatBooking = (b) => ({
  id: b._id.toString(),
  bookingNumber: b.bookingNumber,
  serviceId: b.serviceId?._id?.toString() || b.serviceId?.toString(),
  service:
    b.serviceId && typeof b.serviceId === "object"
      ? {
          id: b.serviceId._id.toString(),
          title: b.serviceId.title,
          category: b.serviceId.category,
          price: b.serviceId.price,
          location: b.serviceId.location,
          image: b.serviceId.image,
          status: b.serviceId.status,
        }
      : null,
  customerId: b.customerId?._id?.toString() || b.customerId?.toString(),
  customer:
    b.customerId && typeof b.customerId === "object"
      ? {
          id: b.customerId._id.toString(),
          name: b.customerId.name,
          avatar: b.customerId.avatar,
          email: b.customerId.email,
          phone: b.customerId.phone || "",
        }
      : null,
  providerId: b.providerId?.toString(),
  customerName: b.customerName,
  customerEmail: b.customerEmail,
  customerPhone: b.customerPhone,
  serviceDate: b.serviceDate ? b.serviceDate.toISOString() : null,
  serviceTime: b.serviceTime,
  serviceAddress: b.serviceAddress,
  notes: b.notes || "",
  totalAmount: b.totalAmount,
  status: b.status,
  createdAt: b.createdAt,
  updatedAt: b.updatedAt,
});

// @desc    Create a new service booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res, next) => {
  try {
    const {
      serviceId,
      customerName,
      customerEmail,
      customerPhone,
      serviceDate,
      serviceTime,
      serviceAddress,
      notes,
    } = req.body;

    if (!serviceId || !customerName || !customerEmail || !customerPhone || !serviceDate || !serviceAddress) {
      return res.status(400).json({
        message: "Please fill in all required fields (service, name, email, phone, date, address)",
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (service.status !== "Active") {
      return res.status(400).json({ message: "This service is currently unavailable for booking" });
    }

    const booking = await Booking.create({
      bookingNumber: generateBookingNumber(),
      serviceId,
      customerId: req.user._id,
      providerId: service.providerId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.trim(),
      serviceDate: new Date(serviceDate),
      serviceTime: serviceTime || "Morning",
      serviceAddress: serviceAddress.trim(),
      notes: notes ? notes.trim() : "",
      totalAmount: service.price,
    });

    // Increment bookingsCount on Service
    await Service.findByIdAndUpdate(serviceId, { $inc: { bookingsCount: 1 } });

    // Notify provider
    try {
      await Notification.create({
        userId: service.providerId,
        fromUserId: req.user._id,
        type: "booking_received",
        title: "New Booking Request",
        body: `${customerName} booked "${service.title}" for ${new Date(serviceDate).toLocaleDateString()}`,
        link: `/app/activity`,
      });
    } catch (_) {}

    // Notify customer
    try {
      await Notification.create({
        userId: req.user._id,
        fromUserId: service.providerId,
        type: "booking_submitted",
        title: "Booking Submitted",
        body: `Your booking for "${service.title}" has been submitted successfully.`,
        link: `/dashboard?tab=bookings`,
      });
    } catch (_) {}

    res.status(201).json({ booking: formatBooking(booking) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings for the logged-in customer
// @route   GET /api/bookings/customer
// @access  Private
const getCustomerBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ customerId: req.user._id })
      .populate("serviceId", "title category price location image status")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ bookings: bookings.map(formatBooking) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings for services owned by the provider
// @route   GET /api/bookings/provider
// @access  Private
const getProviderBookings = async (req, res, next) => {
  try {
    const { status, q } = req.query;

    const queryObj = { providerId: req.user._id };
    if (status && status !== "All") queryObj.status = status;

    let bookings = await Booking.find(queryObj)
      .populate("customerId", "name avatar email phone")
      .populate("serviceId", "title category price location image")
      .sort({ createdAt: -1 })
      .lean();

    // Text search filter in memory
    if (q && q.trim()) {
      const lower = q.trim().toLowerCase();
      bookings = bookings.filter(
        (b) =>
          b.customerName?.toLowerCase().includes(lower) ||
          b.customerEmail?.toLowerCase().includes(lower) ||
          b.bookingNumber?.toLowerCase().includes(lower) ||
          (b.serviceId?.title || "").toLowerCase().includes(lower)
      );
    }

    res.json({ bookings: bookings.map(formatBooking) });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (provider only)
// @route   PATCH /api/bookings/:id/status
// @access  Private (Provider)
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Confirmed", "In Progress", "Completed", "Cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this booking" });
    }

    booking.status = status;
    await booking.save();

    // Notify customer of status change
    try {
      const service = await Service.findById(booking.serviceId).select("title");
      await Notification.create({
        userId: booking.customerId,
        fromUserId: req.user._id,
        type: "booking_status_changed",
        title: "Booking Status Updated",
        body: `Your booking for "${service?.title || "a service"}" is now: ${status}`,
        link: `/dashboard?tab=bookings`,
      });
    } catch (_) {}

    res.json({ booking: formatBooking(booking) });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking (customer or provider)
// @route   DELETE /api/bookings/:id
// @access  Private
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const isCustomer = booking.customerId.toString() === req.user._id.toString();
    const isProvider = booking.providerId.toString() === req.user._id.toString();

    if (!isCustomer && !isProvider) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    booking.status = "Cancelled";
    await booking.save();

    // Decrement bookingsCount on Service
    await Service.findByIdAndUpdate(booking.serviceId, { $inc: { bookingsCount: -1 } });

    res.json({ message: "Booking cancelled successfully", booking: formatBooking(booking) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getCustomerBookings,
  getProviderBookings,
  updateBookingStatus,
  cancelBooking,
};
