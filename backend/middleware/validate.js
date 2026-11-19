const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Cameroon: optional +237, then 9 digits starting with 6 (mobile) or 2 (landline)
const CM_PHONE_RE = /^(?:\+?237)?([62]\d{8})$/;
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const currentYear = new Date().getFullYear();

// Anything that isn't a string becomes "" (blocks objects like {"$gt": ""})
const str = (v) => (typeof v === "string" ? v.trim() : "");

const normalizePhone = (v) => {
  const match = str(v).replace(/[\s().-]/g, "").match(CM_PHONE_RE);
  return match ? `+237${match[1]}` : null;
};

const fail = (res, errors) =>
  res.status(400).json({ message: Object.values(errors)[0], errors });

// ---------- Auth ----------
exports.validateRegister = (req, res, next) => {
  const b = req.body || {};
  const name = str(b.name);
  const email = str(b.email).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const errors = {};

  if (!name) errors.name = "Full name is required";
  else if (name.length < 2 || name.length > 60) errors.name = "Name must be 2 to 60 characters";

  if (!email) errors.email = "Email is required";
  else if (!EMAIL_RE.test(email) || email.length > 100) errors.email = "Enter a valid email address";

  if (!password) errors.password = "Password is required";
  else if (password.length < 8) errors.password = "Password must be at least 8 characters";
  else if (password.length > 72) errors.password = "Password must be 72 characters or fewer";
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    errors.password = "Password must contain at least one letter and one number";

  if (Object.keys(errors).length) return fail(res, errors);

  req.body = { name, email, password }; // role and anything else is dropped
  next();
};

exports.validateLogin = (req, res, next) => {
  const b = req.body || {};
  const email = str(b.email).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const errors = {};

  if (!email) errors.email = "Email is required";
  else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address";
  if (!password) errors.password = "Password is required";

  if (Object.keys(errors).length) return fail(res, errors);

  req.body = { email, password };
  next();
};

// ---------- Orders ----------
exports.validateOrder = (req, res, next) => {
  const { items, shippingInfo } = req.body || {};
  const s = shippingInfo && typeof shippingInfo === "object" ? shippingInfo : {};
  const errors = {};

  const fullName = str(s.fullName);
  const city = str(s.city);
  const address = str(s.address);
  const notes = str(s.notes);
  const phone = normalizePhone(s.phone);

  if (!fullName) errors.fullName = "Full name is required";
  else if (fullName.length < 2 || fullName.length > 80) errors.fullName = "Name must be 2 to 80 characters";

  if (!str(s.phone)) errors.phone = "Phone number is required";
  else if (!phone) errors.phone = "Enter a valid Cameroon phone number, e.g. 6XX XX XX XX";

  if (!city) errors.city = "City is required";
  else if (city.length < 2 || city.length > 60) errors.city = "City must be 2 to 60 characters";

  if (!address) errors.address = "Delivery address is required";
  else if (address.length < 5 || address.length > 150) errors.address = "Address must be 5 to 150 characters";

  if (notes.length > 300) errors.notes = "Notes must be 300 characters or fewer";

  const cleanItems = [];
  if (!Array.isArray(items) || items.length === 0) {
    errors.items = "Your cart is empty";
  } else if (items.length > 50) {
    errors.items = "Too many different items in one order";
  } else {
    for (const i of items) {
      const qty = Number(i?.qty);
      if (
        typeof i?.product !== "string" ||
        !OBJECT_ID_RE.test(i.product) ||
        !Number.isInteger(qty) ||
        qty < 1 ||
        qty > 99
      ) {
        errors.items = "One of the items in your cart is invalid";
        break;
      }
      cleanItems.push({ product: i.product, qty });
    }
  }

  if (Object.keys(errors).length) return fail(res, errors);

  req.body = { items: cleanItems, shippingInfo: { fullName, phone, city, address, notes } };
  next();
};

// ---------- Products (admin) ----------
// partial = true is for PUT, where only the fields that are sent are checked
exports.validateProduct = (partial = false) => (req, res, next) => {
  const b = req.body || {};
  const errors = {};
  const clean = {};
  const has = (key) => b[key] !== undefined;

  const text = (key, label, { min = 0, max = 200, required = false } = {}) => {
    if (partial && !has(key)) return;
    const v = str(b[key]);
    if (!v) {
      if (required) errors[key] = `${label} is required`;
      else if (has(key)) clean[key] = "";
      return;
    }
    if (v.length < min || v.length > max)
      errors[key] = `${label} must be ${min ? `${min} to ${max}` : `at most ${max}`} characters`;
    else clean[key] = v;
  };

  const int = (key, label, min = 0, max = 100000000) => {
    if (partial && !has(key)) return;
    const raw = b[key];
    const n =
      raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "")
        ? NaN
        : Number(raw);
    if (!Number.isInteger(n) || n < min || n > max)
      errors[key] = `${label} must be a whole number from ${min} to ${max.toLocaleString("en-US")}`;
    else clean[key] = n;
  };

  text("name", "Product name", { min: 2, max: 120, required: true });
  text("partNumber", "Part number", { min: 2, max: 50, required: true });
  text("category", "Category", { min: 2, max: 60, required: true });
  text("brand", "Brand", { max: 60 });
  text("description", "Description", { max: 2000 });
  int("price", "Price");
  int("stock", "Stock", 0, 1000000);
  if (!partial) {
    if (!has("price")) errors.price = "Price is required";
    if (!has("stock")) errors.stock = "Stock is required";
  }

  if (!partial || has("images")) {
    const raw = b.images === undefined ? [] : b.images;
    const imgs = Array.isArray(raw) ? raw.map(str).filter(Boolean) : null;
    if (!imgs) errors.images = "Images must be a list";
    else if (imgs.length > 5) errors.images = "A product can have at most 5 images";
    else if (imgs.some((i) => !(i.startsWith("/uploads/") || /^https?:\/\//i.test(i))))
      errors.images = "One of the image paths is invalid";
    else clean.images = imgs;
  }

  if (!partial || has("compatibility")) {
    const raw = b.compatibility === undefined ? [] : b.compatibility;
    if (!Array.isArray(raw) || raw.length > 50) {
      errors.compatibility = "Compatibility must be a list of up to 50 vehicles";
    } else {
      const year = (v) => (v === undefined || v === null || v === "" ? undefined : Number(v));
      const out = [];
      for (const [index, c] of raw.entries()) {
        const row = `Vehicle ${index + 1}`;
        const make = str(c?.make);
        const model = str(c?.model);
        const yearFrom = year(c?.yearFrom);
        const yearTo = year(c?.yearTo);
        const badYear = (y) => y !== undefined && (!Number.isInteger(y) || y < 1950 || y > currentYear + 1);

        if (!make) errors.compatibility = `${row}: make is required`;
        else if (make.length > 60 || model.length > 60) errors.compatibility = `${row}: make and model must be 60 characters or fewer`;
        else if (badYear(yearFrom) || badYear(yearTo))
          errors.compatibility = `${row}: years must be between 1950 and ${currentYear + 1}`;
        else if (yearFrom !== undefined && yearTo !== undefined && yearFrom > yearTo)
          errors.compatibility = `${row}: "from" year cannot be after "to" year`;
        if (errors.compatibility) break;

        const entry = { make, model };
        if (yearFrom !== undefined) entry.yearFrom = yearFrom;
        if (yearTo !== undefined) entry.yearTo = yearTo;
        out.push(entry);
      }
      if (!errors.compatibility) clean.compatibility = out;
    }
  }

  if (Object.keys(errors).length) return fail(res, errors);

  req.body = clean; // only known, cleaned fields reach the database
  next();
};