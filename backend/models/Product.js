const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    partNumber: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    brand: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    description: { type: String, trim: true },
    images: [{ type: String }],
    compatibility: [
      {
        make: String,
        model: String,
        yearFrom: Number,
        yearTo: Number,
      },
    ],
  },
  { timestamps: true }
);

// Enables text search on these fields
productSchema.index({ name: "text", partNumber: "text", brand: "text" });

module.exports = mongoose.model("Product", productSchema);