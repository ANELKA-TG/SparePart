const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

const restoreStock = async (order) => {
  for (const item of order.items) {
    await Product.updateOne({ _id: item.product }, { $inc: { stock: item.qty } });
  }
};

// POST /api/orders
exports.createOrder = async (req, res) => {
  const { items, shippingInfo } = req.body;

  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ message: "No order items" });

  const { fullName, phone, city, address, notes } = shippingInfo || {};
  if (!fullName || !phone || !city || !address)
    return res.status(400).json({ message: "Name, phone, city and address are required" });

  // Merge duplicate products and validate quantities
  const merged = {};
  for (const i of items) {
    const qty = Number(i.qty);
    if (!mongoose.isValidObjectId(i.product) || !Number.isInteger(qty) || qty < 1)
      return res.status(400).json({ message: "Invalid order item" });
    merged[i.product] = (merged[i.product] || 0) + qty;
  }

  const reserved = [];
  const orderItems = [];

  try {
    for (const [id, qty] of Object.entries(merged)) {
      // Atomic: only decrements if enough stock remains
      const product = await Product.findOneAndUpdate(
        { _id: id, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true }
      );

      if (!product) {
        const p = await Product.findById(id);
        throw new Error(
          `${p ? p.name : "An item"} is unavailable or has insufficient stock`
        );
      }

      reserved.push({ id, qty });
      orderItems.push({
        product: product._id,
        name: product.name,
        partNumber: product.partNumber,
        price: product.price, // price always comes from the database
        qty,
      });
    }

    const total = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingInfo: { fullName, phone, city, address, notes },
      paymentMethod: "cod",
      total,
    });

    res.status(201).json(order);
  } catch (err) {
    // Put back any stock we already took
    for (const r of reserved) {
      await Product.updateOne({ _id: r.id }, { $inc: { stock: r.qty } });
    }
    res.status(400).json({ message: err.message });
  }
};

// GET /api/orders/my
exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

// GET /api/orders/:id  (owner or admin)
exports.getOrderById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid order ID" });

  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) return res.status(404).json({ message: "Order not found" });

  const isOwner = order.user._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin")
    return res.status(403).json({ message: "Not allowed to view this order" });

  res.json(order);
};

// PUT /api/orders/:id/cancel  (owner, only while pending)
exports.cancelOrder = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid order ID" });

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.user.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Not allowed" });
  if (order.status !== "pending")
    return res.status(400).json({ message: "Only pending orders can be cancelled" });

  order.status = "cancelled";
  await order.save();
  await restoreStock(order);
  res.json(order);
};

// GET /api/orders  (admin)
exports.getAllOrders = async (req, res) => {
  const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
  res.json(orders);
};

// PUT /api/orders/:id/status  (admin)
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status))
    return res.status(400).json({ message: "Invalid status" });
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid order ID" });

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (order.status === "cancelled" || order.status === "delivered")
    return res.status(400).json({ message: `Order is already ${order.status}` });

  if (status === "cancelled") await restoreStock(order);

  order.status = status;
  if (status === "delivered") {
    order.isPaid = true; // cash collected on delivery
    order.paidAt = new Date();
  }
  await order.save();
  res.json(order);
};