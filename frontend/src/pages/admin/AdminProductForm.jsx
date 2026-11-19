import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../services/api";
import { imageUrl } from "../../utils/imageUrl";
import useForm from "../../hooks/useForm";
import Field from "../../components/Field";
import { isBlankVehicle, validateProduct } from "../../utils/validators";

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const emptyValues = {
  name: "",
  partNumber: "",
  category: "",
  brand: "",
  price: "",
  stock: "",
  description: "",
  images: [],
  compatibility: [],
};

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { values, setValues, errors, handleChange, handleBlur, handleSubmit, submitting, formError } =
    useForm(emptyValues, validateProduct);

  const [categories, setCategories] = useState([]);
  const [vehicles, setVehicles] = useState({ makes: [], models: {} });
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    api.get("/products/categories").then(({ data }) => setCategories(data)).catch(() => {});
    api.get("/products/vehicles").then(({ data }) => setVehicles(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        setValues({
          name: data.name,
          partNumber: data.partNumber,
          category: data.category,
          brand: data.brand || "",
          price: String(data.price),
          stock: String(data.stock),
          description: data.description || "",
          images: data.images || [],
          compatibility: (data.compatibility || []).map((c) => ({
            make: c.make || "",
            model: c.model || "",
            yearFrom: c.yearFrom ?? "",
            yearTo: c.yearTo ?? "",
          })),
        });
      })
      .catch(() => setLoadError("Product not found"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // ---------- images ----------
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = ""; // lets you pick the same file again later
    if (files.length === 0) return;
    setUploadError("");

    if (values.images.length + files.length > MAX_IMAGES) {
      setUploadError(`A product can have at most ${MAX_IMAGES} images`);
      return;
    }
    for (const f of files) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        setUploadError(`"${f.name}" is not a JPG, PNG or WebP image`);
        return;
      }
      if (f.size > MAX_IMAGE_SIZE) {
        setUploadError(`"${f.name}" is larger than 5MB`);
        return;
      }
    }

    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("images", f));
      const { data } = await api.post("/uploads", fd);
      setValues((v) => ({ ...v, images: [...v.images, ...data.urls] }));
    } catch (err) {
      setUploadError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) =>
    setValues((v) => ({ ...v, images: v.images.filter((_, i) => i !== index) }));
  const makeMain = (index) =>
    setValues((v) => ({
      ...v,
      images: [v.images[index], ...v.images.filter((_, i) => i !== index)],
    }));

  // ---------- compatible vehicles ----------
  const updateVehicle = (index, field, value) =>
    setValues((v) => ({
      ...v,
      compatibility: v.compatibility.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }));
  const addVehicle = () =>
    setValues((v) => ({
      ...v,
      compatibility: [...v.compatibility, { make: "", model: "", yearFrom: "", yearTo: "" }],
    }));
  const removeVehicle = (index) =>
    setValues((v) => ({ ...v, compatibility: v.compatibility.filter((_, i) => i !== index) }));

  // ---------- submit ----------
  const onSubmit = handleSubmit(async (v) => {
    const payload = {
      name: v.name.trim(),
      partNumber: v.partNumber.trim(),
      category: v.category.trim(),
      brand: v.brand.trim(),
      price: Number(v.price),
      stock: Number(v.stock),
      description: v.description.trim(),
      images: v.images,
      compatibility: v.compatibility
        .filter((c) => !isBlankVehicle(c))
        .map((c) => ({
          make: c.make.trim(),
          model: c.model.trim(),
          yearFrom: String(c.yearFrom).trim() === "" ? undefined : Number(c.yearFrom),
          yearTo: String(c.yearTo).trim() === "" ? undefined : Number(c.yearTo),
        })),
    };

    if (isEdit) await api.put(`/products/${id}`, payload);
    else await api.post("/products", payload);
    navigate("/admin/products");
  });

  if (loading) return <p>Loading...</p>;
  if (loadError)
    return (
      <div>
        <Link to="/admin/products"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24px" width="24px" fill="#000000"><path d="M10,18L4,12l6-6l1.4,1.45L7.85,11H20v2H7.85l3.55,3.55L10,18Z"/></svg> Back to products</Link>
        <p className="error">{loadError}</p>
      </div>
    );

  const field = (name) => ({
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    "aria-invalid": !!errors[name],
  });

  const allModels = [...new Set(Object.values(vehicles.models).flat())].sort();
  const compatError = errors.compatibility;
  const rowErrors = compatError && typeof compatError === "object" ? compatError : {};
  const compatMessage = typeof compatError === "string" ? compatError : "";
  const imageMessage = errors.images || uploadError;

  return (
    <div>
      <Link to="/admin/products"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24px" width="24px" fill="#000000"><path d="M10,18L4,12l6-6l1.4,1.45L7.85,11H20v2H7.85l3.55,3.55L10,18Z"/></svg> Back to products</Link>
      <h2>{isEdit ? "Edit product" : "Add product"}</h2>

      <form onSubmit={onSubmit} className="form wide" noValidate>
        <div className="grid-2">
          <Field label="Product name" error={errors.name}>
            <input {...field("name")} />
          </Field>
          <Field label="Part number" error={errors.partNumber} hint="Must be unique">
            <input {...field("partNumber")} />
          </Field>
          <Field label="Category" error={errors.category}>
            <input {...field("category")} list="category-list" />
          </Field>
          <datalist id="category-list">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
          <Field label="Brand (optional)" error={errors.brand}>
            <input {...field("brand")} />
          </Field>
          <Field label="Price (FCFA)" error={errors.price}>
            <input {...field("price")} type="number" min="0" step="1" inputMode="numeric" />
          </Field>
          <Field label="Stock quantity" error={errors.stock}>
            <input {...field("stock")} type="number" min="0" step="1" inputMode="numeric" />
          </Field>
        </div>

        <Field
          label="Description (optional)"
          error={errors.description}
          hint={`${values.description.length}/2000`}
        >
          <textarea {...field("description")} rows={3} />
        </Field>

        <div id="images">
          <h3>Images</h3>
          <div className="image-manager">
            {values.images.map((src, i) => (
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

            {values.images.length < MAX_IMAGES && (
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
          {imageMessage && <p className="field-error" role="alert">{imageMessage}</p>}
        </div>

        <div id="compatibility">
          <h3>Compatibility</h3>
          <datalist id="make-list">
            {vehicles.makes.map((m) => <option key={m} value={m} />)}
          </datalist>
          <datalist id="model-list">
            {allModels.map((m) => <option key={m} value={m} />)}
          </datalist>

          {values.compatibility.map((c, i) => {
            const re = rowErrors[i] || {};
            return (
              <div className="compat-item" key={i}>
                <div className="compat-row">
                  <input
                    className={re.make ? "invalid" : ""}
                    placeholder="Make (e.g. Toyota)"
                    list="make-list"
                    value={c.make}
                    onChange={(e) => updateVehicle(i, "make", e.target.value)}
                  />
                  <input
                    className={re.model ? "invalid" : ""}
                    placeholder="Model (e.g. Corolla)"
                    list="model-list"
                    value={c.model}
                    onChange={(e) => updateVehicle(i, "model", e.target.value)}
                  />
                  <input
                    className={re.yearFrom ? "invalid" : ""}
                    type="number"
                    placeholder="From year"
                    value={c.yearFrom}
                    onChange={(e) => updateVehicle(i, "yearFrom", e.target.value)}
                  />
                  <input
                    className={re.yearTo ? "invalid" : ""}
                    type="number"
                    placeholder="To year"
                    value={c.yearTo}
                    onChange={(e) => updateVehicle(i, "yearTo", e.target.value)}
                  />
                  <button type="button" className="link-btn danger-text" onClick={() => removeVehicle(i)}>
                    Remove
                  </button>
                </div>
                {Object.keys(re).length > 0 && (
                  <p className="field-error" role="alert">
                    Vehicle {i + 1}: {Object.values(re)[0]}
                  </p>
                )}
              </div>
            );
          })}

          <button type="button" className="btn secondary" onClick={addVehicle}>
            + Add compatible vehicle
          </button>
          {compatMessage && <p className="field-error" role="alert">{compatMessage}</p>}
        </div>

        {formError && <p className="error" role="alert">{formError}</p>}
        <button className="btn" disabled={submitting || uploading}>
          {submitting ? "Saving..." : isEdit ? "Save changes" : "Create product"}
        </button>
      </form>
    </div>
  );
}