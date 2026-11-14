import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { imageUrl } from "../utils/imageUrl";
import { CartIcon, ImageIcon } from "./Icons";

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [added, setAdded] = useState(false);

  const out = product.stock === 0;
  const low = product.stock > 0 && product.stock <= 5;
  const link = `/products/${product._id}`;

  const handleAdd = () => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className="card">
      <Link to={link} className="card-img">
        {product.images?.[0] ? (
          <img src={imageUrl(product.images[0])} alt={product.name} loading="lazy" />
        ) : (
          <span className="no-img"><ImageIcon size={32} /></span>
        )}
        <span className="tag">{product.category}</span>
        {out ? (
          <span className="stock-badge out">Out of stock</span>
        ) : low ? (
          <span className="stock-badge low">Only {product.stock} left</span>
        ) : (
          <span className="stock-badge in">In stock</span>
        )}
      </Link>

      <div className="card-body">
        {product.brand && <p className="card-brand">{product.brand}</p>}
        <h3><Link to={link}>{product.name}</Link></h3>
        <p className="muted">Part No: {product.partNumber}</p>
        <p className="price">{product.price.toLocaleString()} <small>FCFA</small></p>
        <div className="card-actions">
          <Link to={link} className="btn outline">Details</Link>
          <button className="btn" disabled={out} onClick={handleAdd}>
            {added ? "Added ✓" : <><CartIcon size={16} /> Add</>}
          </button>
        </div>
      </div>
    </article>
  );
}