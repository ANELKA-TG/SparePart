import { useEffect, useState } from "react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Wait 400ms after typing stops before calling the API
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/products", {
          params: { search, category, page, limit: 12 },
        });
        setProducts(data.products);
        setPages(data.pages);
      } catch (err) {
        setError("Could not load products. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, category, page]);

  useEffect(() => {
  api.get("/products/categories").then(({ data }) => setCategories(data)).catch(() => {});
}, []);

  return (
    <div className="container">
      <h1>Spare Parts</h1>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by name, part number or brand..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
        >
          <option value="">All categories</option>
{categories.map((c) => (
  <option key={c} value={c}>{c}</option>
))}
          <option value="Brakes">Brakes</option>
          <option value="Engine">Engine</option>
          <option value="Suspension">Suspension</option>
          <option value="Electrical">Electrical</option>
          <option value="Filters">Filters</option>
        </select>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && products.length === 0 && <p>No products found.</p>}

      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>

      {pages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span>Page {page} of {pages}</span>
          <button disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}