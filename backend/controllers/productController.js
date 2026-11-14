const Product = require("../models/Product");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name_asc: { name: 1 },
};

// GET /api/products?search=&category=&brand=Bosch,Denso&minPrice=&maxPrice=&inStock=1&sort=&make=&model=&year=&page=&limit=
exports.getProducts = async (req, res) => {
  try {
    const { search, category, brand, minPrice, maxPrice, inStock, make, model, year } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;

    const filter = {};
    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;

    if (brand) {
      const list = brand.split(",").map((b) => b.trim()).filter(Boolean);
      if (list.length) filter.brand = { $in: list };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (inStock === "1" || inStock === "true") filter.stock = { $gt: 0 };

    // Vehicle compatibility: every condition must match the SAME vehicle entry
    if (make || model || year) {
      const match = {};
      if (make) match.make = new RegExp(`^${escapeRegex(make)}$`, "i");
      if (model) match.model = new RegExp(`^${escapeRegex(model)}$`, "i");
      if (year) {
        const y = Number(year);
        if (!Number.isInteger(y)) return res.status(400).json({ message: "Invalid year" });
        match.yearFrom = { $not: { $gt: y } };
        match.yearTo = { $not: { $lt: y } };
      }
      filter.compatibility = { $elemMatch: match };
    }

    const sortBy = SORTS[req.query.sort] || SORTS.newest;

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ ...sortBy, _id: -1 }) // _id keeps pages stable when values tie
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ products, page, pages: Math.ceil(total / limit), total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json(categories.filter(Boolean).sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/brands
exports.getBrands = async (req, res) => {
  try {
    const brands = await Product.distinct("brand");
    res.json(brands.filter(Boolean).sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/vehicles  →  { makes: [...], models: { Toyota: ["Corolla", ...], ... } }
exports.getVehicles = async (req, res) => {
  try {
    const rows = await Product.aggregate([
      { $unwind: "$compatibility" },
      { $match: { "compatibility.make": { $nin: [null, ""] } } },
      { $group: { _id: { make: "$compatibility.make", model: "$compatibility.model" } } },
    ]);

    const models = {};
    for (const r of rows) {
      const { make, model } = r._id;
      if (!models[make]) models[make] = [];
      if (model && !models[make].includes(model)) models[make].push(model);
    }
    for (const make of Object.keys(models)) models[make].sort();

    res.json({ makes: Object.keys(models).sort(), models });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: "Invalid product ID" });
  }
};

// POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(400).json({ message: "Invalid product ID" });
  }
};