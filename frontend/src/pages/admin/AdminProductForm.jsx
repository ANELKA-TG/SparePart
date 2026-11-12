import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../services/api";

const emptyForm = {
  name: "",
  partNumber: "",
  category: "",
  brand: "",
  price: "",
  stock: "",
  description: "",
  images: "",
};

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [compat, setCompat] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/products/categories").then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        setForm({
          name: data.name,
          partNumber: data.partNumber,
          category: data.category,
          brand: data.brand || "",
          price: data.price,
          stock: data.stock,
          description: data.description || "",
          images: (data.images || []).join("\n"),
        });
        setCompat(
          (data.compatibility || []).map((c) => ({
            make: c.make || "",
            model: c.model || "",
            yearFrom: c.yearFrom ?? "",
            yearTo: c.yearTo ?? "",
          }))
        );
      })
      .catch(() => setError("Product not found"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const updateCompat = (index, field, value) =>
    setCompat((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  const addCompat = () =>
    setCompat((prev) => [...prev, { make: "", model: "", yearFrom: "", yearTo: "" }]);
  const removeCompat = (index) => setCompat((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      name: form.name,
      partNumber: form.partNumber,
      category: form.category,
      brand: form.brand,
      price: Number(form.price),
      stock: Number(form.stock),
      description: form.description,
      images: form.images.split("\n").map((s) => s.trim()).filter(Boolean),
      compatibility: compat
        .filter((c) => c.make.trim())
        .map((c) => ({
          make: c.make.trim(),
          model: c.model.trim(),
          yearFrom: c.yearFrom === "" ? undefined : Number(c.yearFrom),
          yearTo: c.yearTo === "" ? undefined : Number(c.yearTo),
        })),
    };

    try {
      if (isEdit) await api.put(`/products/${id}`, payload);
      else await api.post("/products", payload);
      navigate("/admin/products");
    } catch (err) {
      const msg = err.response?.data?.message || "Could not save product";
      setError(msg.includes("E11000") ? "A product with this part number already exists" : msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <Link to="/admin/products"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24px" width="24px" fill="#000000"><path d="M10,18L4,12l6-6l1.4,1.45L7.85,11H20v2H7.85l3.55,3.55L10,18Z"/></svg> Back to products</Link>
      <h2>{isEdit ? "Edit product" : "Add product"}</h2>

      <form onSubmit={handleSubmit} className="form wide">
        <div className="grid-2">
          <input name="name" placeholder="Product name" value={form.name}
            onChange={handleChange} required />
          <input name="partNumber" placeholder="Part number" value={form.partNumber}
            onChange={handleChange} required />
          <input name="category" placeholder="Category" list="category-list"
            value={form.category} onChange={handleChange} required />
          <datalist id="category-list">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
          <input name="brand" placeholder="Brand" value={form.brand} onChange={handleChange} />
          <input name="price" type="number" min="0" placeholder="Price (FCFA)"
            value={form.price} onChange={handleChange} required />
          <input name="stock" type="number" min="0" placeholder="Stock quantity"
            value={form.stock} onChange={handleChange} required />
        </div>

        <textarea name="description" placeholder="Description" rows={3}
          value={form.description} onChange={handleChange} />

        <textarea name="images" rows={3}
          placeholder={"Image URLs, one per line\nhttps://example.com/part1.jpg"}
          value={form.images} onChange={handleChange} />

        <h3>Compatibility</h3>
        {compat.map((c, i) => (
          <div className="compat-row" key={i}>
            <input placeholder="Make (e.g. Toyota)" value={c.make}
              onChange={(e) => updateCompat(i, "make", e.target.value)} />
            <input placeholder="Model (e.g. Corolla)" value={c.model}
              onChange={(e) => updateCompat(i, "model", e.target.value)} />
            <input type="number" placeholder="From year" value={c.yearFrom}
              onChange={(e) => updateCompat(i, "yearFrom", e.target.value)} />
            <input type="number" placeholder="To year" value={c.yearTo}
              onChange={(e) => updateCompat(i, "yearTo", e.target.value)} />
            <button type="button" className="link-btn danger-text" onClick={() => removeCompat(i)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="btn secondary" onClick={addCompat}>
          + Add compatible vehicle
        </button>

        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create product"}
        </button>
      </form>
    </div>
  );
}