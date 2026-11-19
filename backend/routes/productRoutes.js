const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getBrands,
  getVehicles,
} = require("../controllers/productController");
const { protect, adminOnly } = require("../middleware/auth");
const { validateProduct } = require("../middleware/validate");

router.get("/categories", getCategories); // these three must stay above "/:id"
router.get("/brands", getBrands);
router.get("/vehicles", getVehicles);

router
  .route("/")
  .get(getProducts)
  .post(protect, adminOnly, validateProduct(), createProduct);
router
  .route("/:id")
  .get(getProductById)
  .put(protect, adminOnly, validateProduct(true), updateProduct)
  .delete(protect, adminOnly, deleteProduct);

module.exports = router;