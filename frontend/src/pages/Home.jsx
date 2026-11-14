import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import { CarIcon, CashIcon, FilterIcon, SearchIcon, ShieldIcon, TruckIcon } from "../components/Icons";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1978 }, (_, i) => currentYear + 1 - i);

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name_asc", label: "Name: A to Z" },
];

export default function Home() {
  const [params, setParams] = useSearchParams();
  const resultsRef = useRef(null);

  // All filters live in the URL
  const get = (key) => params.get(key) || "";
  const search = get("search");
  const category = get("category");
  const make = get("make");
  const model = get("model");
  const year = get("year");
  const minPrice = get("minPrice");
  const maxPrice = get("maxPrice");
  const inStock = get("inStock") === "1";
  const sort = get("sort") || "newest";
  const brands = get("brand") ? get("brand").split(",") : [];
  const page = Number(get("page")) || 1;

  const [products, setProducts] = useState([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState([]);
  const [brandList, setBrandList] = useState([]);
  const [vehicles, setVehicles] = useState({ makes: [], models: {} });
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter options (loaded once)
  useEffect(() => {
    api.get("/products/categories").then(({ data }) => setCategories(data)).catch(() => {});
    api.get("/products/brands").then(({ data }) => setBrandList(data)).catch(() => {});
    api.get("/products/vehicles").then(({ data }) => setVehicles(data)).catch(() => {});
  }, []);

  // Products (reloaded whenever the URL filters change)
  const query = params.toString();
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/products", {
          params: { ...Object.fromEntries(params), limit: 12 },
        });
        if (cancelled) return;
        setProducts(data.products);
        setPages(data.pages);
        setTotal(data.total);
      } catch {
        if (!cancelled) setError("Could not load products. Is the backend running?");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Change one or more filters in a single URL update
  const update = (changes, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) next.delete(key);
      else next.set(key, value);
    });
    if (resetPage) next.delete("page");
    setParams(next, { replace: true });
  };

  const clearAll = () => setParams({}, { replace: true });

  const toggleBrand = (b) => {
    const next = brands.includes(b) ? brands.filter((x) => x !== b) : [...brands, b];
    update({ brand: next.join(",") });
  };

  const goToPage = (p) => {
    update({ page: p > 1 ? String(p) : "" }, false);
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const modelOptions = make ? vehicles.models[make] || [] : [];
  const hasVehicle = make || model || year;
  const hasFilters =
    search || category || brands.length || minPrice || maxPrice || inStock || hasVehicle;

  return (
    <>
      {/* ---------- Hero with vehicle finder ---------- */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <h1>Find the right spare parts for your vehicle</h1>
            <p>
              Choose your make, model and year to see only the parts that fit.
              Pay cash when your order arrives.
            </p>
          </div>

          <div className="finder">
            <h2><CarIcon size={20} /> Find parts for your vehicle</h2>
            <div className="finder-grid">
              <label>
                Make
                <select value={make} onChange={(e) => update({ make: e.target.value, model: "" })}>
                  <option value="">Any make</option>
                  {vehicles.makes.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
              <label>
                Model
                <select value={model} disabled={!make} onChange={(e) => update({ model: e.target.value })}>
                  <option value="">{make ? "Any model" : "Select make first"}</option>
                  {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
              <label>
                Year
                <select value={year} onChange={(e) => update({ year: e.target.value })}>
                  <option value="">Any year</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>
            </div>
            <button
              className="btn"
              onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              Show parts
            </button>
          </div>
        </div>
      </section>

      <div className="container wide">
        {/* ---------- Benefits ---------- */}
        <div className="features">
          <div className="feature">
            <span className="feature-icon"><CashIcon size={22} /></span>
            <div>
              <strong>Cash on delivery</strong>
              <p className="muted">Inspect your parts, then pay when they arrive.</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon"><ShieldIcon size={22} /></span>
            <div>
              <strong>Fitment filter</strong>
              <p className="muted">Select your vehicle to see only compatible parts.</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon"><TruckIcon size={22} /></span>
            <div>
              <strong>Track your order</strong>
              <p className="muted">Follow every order from confirmation to delivery.</p>
            </div>
          </div>
        </div>

        {hasVehicle && (
          <div className="fit-banner">
            <span>
              Showing parts that fit: <strong>{[make, model, year].filter(Boolean).join(" ")}</strong>
            </span>
            <button className="link-btn" onClick={() => update({ make: "", model: "", year: "" })}>
              Clear vehicle
            </button>
          </div>
        )}

        <div className="shop-layout">
          {/* ---------- Filters ---------- */}
          <aside className={`sidebar ${filtersOpen ? "open" : ""}`}>
            <div className="sidebar-head">
              <h3>Filters</h3>
              {hasFilters && <button className="link-btn" onClick={clearAll}>Reset all</button>}
            </div>

            <div className="filter-group">
              <h4>Category</h4>
              <ul className="cat-list">
                <li>
                  <button className={!category ? "active" : ""} onClick={() => update({ category: "" })}>
                    All categories
                  </button>
                </li>
                {categories.map((c) => (
                  <li key={c}>
                    <button className={category === c ? "active" : ""} onClick={() => update({ category: c })}>
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {brandList.length > 0 && (
              <div className="filter-group">
                <h4>Brand</h4>
                {brandList.map((b) => (
                  <label className="check" key={b}>
                    <input type="checkbox" checked={brands.includes(b)} onChange={() => toggleBrand(b)} />
                    {b}
                  </label>
                ))}
              </div>
            )}

            <div className="filter-group">
              <h4>Price (FCFA)</h4>
              <div className="price-range">
                <input type="number" min="0" placeholder="Min" value={minPrice}
                  onChange={(e) => update({ minPrice: e.target.value })} />
                <span>–</span>
                <input type="number" min="0" placeholder="Max" value={maxPrice}
                  onChange={(e) => update({ maxPrice: e.target.value })} />
              </div>
            </div>

            <div className="filter-group">
              <h4>Availability</h4>
              <label className="check">
                <input type="checkbox" checked={inStock}
                  onChange={(e) => update({ inStock: e.target.checked ? "1" : "" })} />
                In stock only
              </label>
            </div>
          </aside>

          {/* ---------- Results ---------- */}
          <section>
            <div className="results-head" ref={resultsRef}>
              <div>
                <h2>{search ? `Results for “${search}”` : "All parts"}</h2>
                <p className="muted">
                  {loading ? "Loading…" : `${total} part${total === 1 ? "" : "s"} found`}
                </p>
              </div>
              <div className="results-tools">
                <button className="btn outline filters-btn" onClick={() => setFiltersOpen((o) => !o)}>
                  <FilterIcon size={16} /> Filters
                </button>
                <select value={sort} aria-label="Sort by" onChange={(e) => update({ sort: e.target.value })}>
                  {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {error && <p className="error">{error}</p>}

            {loading && (
              <div className="grid">
                {Array.from({ length: 6 }).map((_, i) => <div className="card skeleton" key={i} />)}
              </div>
            )}

            {!loading && !error && products.length === 0 && (
              <div className="empty">
                <SearchIcon size={36} />
                <h3>No parts found</h3>
                <p className="muted">Try removing a filter or searching for something else.</p>
                {hasFilters && <button className="btn" onClick={clearAll}>Reset filters</button>}
              </div>
            )}

            {!loading && products.length > 0 && (
              <div className="grid">
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
            )}

            {pages > 1 && (
              <div className="pagination">
                <button disabled={page === 1} onClick={() => goToPage(page - 1)}>Previous</button>
                <span>Page {page} of {pages}</span>
                <button disabled={page === pages} onClick={() => goToPage(page + 1)}>Next</button>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}