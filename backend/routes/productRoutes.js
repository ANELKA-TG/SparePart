const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} = require("../controllers/productController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/categories", getCategories); // must stay above "/:id"
router.route("/").get(getProducts).post(protect, adminOnly, createProduct);
router
  .route("/:id")
  .get(getProductById)
  .put(protect, adminOnly, updateProduct)
  .delete(protect, adminOnly, deleteProduct);

module.exports = router;