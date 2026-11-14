import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../services/api";
import { imageUrl } from "../../utils/imageUrl";

const MAX_IMAGES = 5;

const emptyForm = {
  name: "",
  partNumber: "",
  category: "",
  brand: "",
  price: "",
  stock: "",
  description: "",
};

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [compat, setCompat] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vehicles, setVehicles] = useState({ makes: [], models: {} });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get("/products/categories").then(({ data }) => setCategories(data)).catch(() => {});
    api.get("/products/vehicles").then(({ data }) => setVehicles(data)).catch(() => {});
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
        });
        setImages(data.images || []);
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

  // ---- images ----
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = ""; // lets you pick the same file again later
    if (files.length === 0) return;

    if (images.length + files.length > MAX_IMAGES) {
      setError(`A product can have at most ${MAX_IMAGES} images`);
      return;
    }

    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("images", f));
      const { data } = await api.post("/uploads", fd);
      setImages((prev) => [...prev, ...data.urls]);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => setImages((prev) => prev.filter((_, i) => i !== index));
  const makeMain = (index) =>
    setImages((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);

  // ---- compatibility ----
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
      images,
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

  const allModels = [...new Set(Object.values(vehicles.models).flat())].sort();

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

        <h3>Images</h3>
        <div className="image-manager">
          {images.map((src, i) => (
            <div className="image-tile" key={src}>
              <img src={imageUrl(src)} alt={`Product ${i + 1}`} />
              <div className="image-tile-actions">
                {i === 0 ? (
                  <span className="main-tag">Main</span>
                ) : (
                  <button type="button" className="link-btn" onClick={() => makeMain(i)}>
                    Make main
                  </button>
                )}
                <button type="button" className="link-btn danger-text" onClick={() => removeImage(i)}>
                  Remove
                </button>
              </div>
            </div>
          ))}

          {images.length < MAX_IMAGES && (
            <label className="image-add">
              {uploading ? "Uploading..." : "+ Add images"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={handleFiles}
                disabled={uploading}
              />
            </label>
          )}
        </div>
        <p className="muted">
          Up to {MAX_IMAGES} images (JPG, PNG or WebP, 5MB each). The first image is the main one.
        </p>

        <h3>Compatibility</h3>
        <datalist id="make-list">
          {vehicles.makes.map((m) => <option key={m} value={m} />)}
        </datalist>
        <datalist id="model-list">
          {allModels.map((m) => <option key={m} value={m} />)}
        </datalist>
        {compat.map((c, i) => (
          <div className="compat-row" key={i}>
            <input placeholder="Make (e.g. Toyota)" list="make-list" value={c.make}
              onChange={(e) => updateCompat(i, "make", e.target.value)} />
            <input placeholder="Model (e.g. Corolla)" list="model-list" value={c.model}
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
        <button className="btn" disabled={saving || uploading}>
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create product"}
        </button>
      </form>
    </div>
  );
}