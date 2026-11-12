import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  const inStock = product.stock > 0;
  return (
    <div className="card">
      <div className="card-img">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} />
        ) : (
          <span>No image</span>
        )}
      </div>
      <h3>{product.name}</h3>
      <p className="muted">
        {product.brand} . {product.category}
      </p>
      <p className="price">{product.price.toLocaleString()} FCFA</p>
      <p className={inStock ? "in-stock" : "out-stock"}>
        {inStock ? "In stock" : "Out of stock"}
      </p>
      <Link to={`/products/${product._id}`} className="btn">View details</Link>
    </div>
  );
}