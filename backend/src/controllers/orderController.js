const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { createNotification } = require("./notificationController");

// @desc  Place a new order (Buyer)
// @route POST /api/orders
// @access Private (Buyer authenticated)
const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No order items provided" });
    }

    // Group items by seller so each seller gets an order
    const sellerGroupMap = new Map();

    for (const item of items) {
      let sellerId = item.sellerId;
      if (!sellerId && item.id) {
        const prod = await Product.findById(item.id);
        if (prod) sellerId = prod.sellerId;
      }
      if (!sellerId) {
        const defaultSeller = await User.findOne({ role: "product" });
        sellerId = defaultSeller ? defaultSeller._id : req.user._id;
      }

      if (!sellerGroupMap.has(sellerId.toString())) {
        sellerGroupMap.set(sellerId.toString(), []);
      }
      sellerGroupMap.get(sellerId.toString()).push({
        productId: item.id || null,
        title: item.title,
        price: item.price,
        qty: item.qty || 1,
        image: item.image,
        selectedSize: item.selectedSize,
        selectedColour: item.selectedColour,
      });
    }

    const createdOrders = [];
    for (const [sellerIdStr, groupItems] of sellerGroupMap.entries()) {
      const orderNumber = `#ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const totalAmount = groupItems.reduce((sum, i) => sum + i.price * i.qty, 0);

      const order = await Order.create({
        orderNumber,
        buyerId: req.user._id,
        sellerId: sellerIdStr,
        items: groupItems,
        totalAmount,
        status: "Received",
        shippingAddress: shippingAddress || "Accra, Ghana",
      });

      createdOrders.push(order);

      // Notify the seller about the new order
      await createNotification({
        userId: sellerIdStr,
        type: "order_placed",
        title: "New Order Received!",
        body: `${req.user.name} placed order ${orderNumber} — GHS ${totalAmount.toLocaleString()}`,
        fromUser: req.user._id,
        link: "/app/activity",
      });
    }

    res.status(201).json({ orders: createdOrders });
  } catch (error) {
    next(error);
  }
};

// @desc  Get orders for buyer
// @route GET /api/orders/buyer
// @access Private
const getBuyerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyerId: req.user._id })
      .populate("sellerId", "name avatar location phone companyName companyLogo")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = orders.map((o) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      status: o.status,
      totalAmount: o.totalAmount,
      shippingAddress: o.shippingAddress,
      createdAt: o.createdAt,
      items: o.items,
      seller: o.sellerId
        ? {
            id: o.sellerId._id.toString(),
            name: o.sellerId.companyName || o.sellerId.name,
            avatar: o.sellerId.companyLogo || o.sellerId.avatar || "",
            location: o.sellerId.location || "Accra, Ghana",
            phone: o.sellerId.phone || "",
          }
        : { name: "Vagoda Seller", avatar: "", phone: "" },
    }));

    res.json({ orders: formatted });
  } catch (error) {
    next(error);
  }
};

// @desc  Get orders for seller
// @route GET /api/orders/seller
// @access Private
const getSellerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ sellerId: req.user._id })
      .populate("buyerId", "name avatar email phone")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = orders.map((o) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      status: o.status,
      totalAmount: o.totalAmount,
      shippingAddress: o.shippingAddress,
      createdAt: o.createdAt,
      items: o.items,
      buyer: o.buyerId
        ? {
            id: o.buyerId._id.toString(),
            name: o.buyerId.name,
            avatar: o.buyerId.avatar || "",
            email: o.buyerId.email,
            phone: o.buyerId.phone || "",
          }
        : { name: "Customer", avatar: "", phone: "" },
    }));

    res.json({ orders: formatted });
  } catch (error) {
    next(error);
  }
};

// @desc  Update order status (Seller)
// @route PATCH /api/orders/:id/status
// @access Private (Seller)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ["Received", "Processing", "Shipped", "Delivered", "Cancelled"];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${allowed.join(", ")}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const prevStatus = order.status;
    order.status = status;
    await order.save();

    // Notify the buyer about the status change
    if (prevStatus !== status) {
      await createNotification({
        userId: order.buyerId.toString(),
        type: "order_status",
        title: `Order ${order.orderNumber} — ${status}`,
        body: `Your order status has been updated to: ${status}`,
        fromUser: req.user._id,
        link: "/dashboard?tab=orders",
      });
    }

    res.json({ message: "Order status updated", order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getBuyerOrders,
  getSellerOrders,
  updateOrderStatus,
};
