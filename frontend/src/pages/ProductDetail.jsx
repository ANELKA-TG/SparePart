import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch(() => setError("Product not found"));
  }, [id]);

  if (error) return <div className="container"><p className="error">{error}</p></div>;
  if (!product) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <Link to="/"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24px" width="24px" fill="#000000"><path d="M10,18L4,12l6-6l1.4,1.45L7.85,11H20v2H7.85l3.55,3.55L10,18Z"/></svg> Back to products</Link>
      <div className="detail">
        <div className="card-img big">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} />
          ) : (
            <span>No image</span>
          )}
        </div>
        <div>
          <h1>{product.name}</h1>
          <p className="muted">Part No: {product.partNumber}</p>
          <p className="muted">{product.brand} . {product.category}</p>
          <p className="price">{product.price.toLocaleString()} FCFA</p>
          <p className={product.stock > 0 ? "in-stock" : "out-stock"}>
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>
          <p>{product.description}</p>

          {product.compatibility?.length > 0 && (
            <>
              <h3>Compatible with</h3>
              <ul>
                {product.compatibility.map((c, i) => (
                  <li key={i}>
                    {c.make} {c.model} ({c.yearFrom}–{c.yearTo})
                  </li>
                ))}
              </ul>
            </>
          )}

          <button className="btn" disabled={product.stock === 0}>
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}