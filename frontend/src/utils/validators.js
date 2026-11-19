const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CM_PHONE_RE = /^(?:\+?237)?[62]\d{8}$/;

export const isPhone = (v) => CM_PHONE_RE.test(String(v).replace(/[\s().-]/g, ""));

export const passwordChecks = (p) => ({
  length: p.length >= 8,
  letter: /[A-Za-z]/.test(p),
  number: /\d/.test(p),
});

// Each validator returns an object like { email: "message" }. Empty means valid.

export function validateLogin({ email, password }) {
  const e = {};
  if (!email.trim()) e.email = "Email is required";
  else if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email address";
  if (!password) e.password = "Password is required";
  return e;
}

export function validateRegister({ name, email, password, confirm }) {
  const e = {};
  const n = name.trim();
  if (!n) e.name = "Full name is required";
  else if (n.length < 2 || n.length > 60) e.name = "Name must be 2 to 60 characters";

  if (!email.trim()) e.email = "Email is required";
  else if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email address";

  const c = passwordChecks(password);
  if (!password) e.password = "Password is required";
  else if (!c.length) e.password = "Password must be at least 8 characters";
  else if (password.length > 72) e.password = "Password must be 72 characters or fewer";
  else if (!c.letter || !c.number) e.password = "Password must contain at least one letter and one number";

  if (!confirm) e.confirm = "Please confirm your password";
  else if (confirm !== password) e.confirm = "Passwords do not match";
  return e;
}

export function validateCheckout({ fullName, phone, city, address, notes }) {
  const e = {};
  const name = fullName.trim();
  if (!name) e.fullName = "Full name is required";
  else if (name.length < 2 || name.length > 80) e.fullName = "Name must be 2 to 80 characters";

  if (!phone.trim()) e.phone = "Phone number is required";
  else if (!isPhone(phone)) e.phone = "Enter a valid Cameroon phone number, e.g. 6XX XX XX XX";

  const c = city.trim();
  if (!c) e.city = "City is required";
  else if (c.length < 2 || c.length > 60) e.city = "City must be 2 to 60 characters";

  const a = address.trim();
  if (!a) e.address = "Delivery address is required";
  else if (a.length < 5 || a.length > 150) e.address = "Address must be 5 to 150 characters";

  if (notes.length > 300) e.notes = "Notes must be 300 characters or fewer";
  return e;
}

// ---------- Admin product form ----------
const YEAR_MAX = new Date().getFullYear() + 1;

// A vehicle row with nothing typed in it is ignored instead of flagged
export const isBlankVehicle = (c) =>
  !c.make.trim() &&
  !c.model.trim() &&
  String(c.yearFrom).trim() === "" &&
  String(c.yearTo).trim() === "";

const textRule = (value, label, { min = 0, max, required = false }) => {
  const s = value.trim();
  if (!s) return required ? `${label} is required` : "";
  if (s.length < min || s.length > max)
    return `${label} must be ${min ? `${min} to ${max}` : `at most ${max}`} characters`;
  return "";
};

const intRule = (value, label, max) => {
  const s = String(value).trim();
  if (s === "") return `${label} is required`;
  if (!/^\d+$/.test(s) || Number(s) > max)
    return `${label} must be a whole number from 0 to ${max.toLocaleString("en-US")}`;
  return "";
};

export function validateProduct(v) {
  const e = {};

  const rules = [
    ["name", textRule(v.name, "Product name", { min: 2, max: 120, required: true })],
    ["partNumber", textRule(v.partNumber, "Part number", { min: 2, max: 50, required: true })],
    ["category", textRule(v.category, "Category", { min: 2, max: 60, required: true })],
    ["brand", textRule(v.brand, "Brand", { max: 60 })],
    ["price", intRule(v.price, "Price", 100000000)],
    ["stock", intRule(v.stock, "Stock", 1000000)],
    ["description", textRule(v.description, "Description", { max: 2000 })],
  ];
  for (const [key, message] of rules) if (message) e[key] = message;

  if (v.images.length > 5) e.images = "A product can have at most 5 images";

  // Vehicles: errors are collected per row, e.g. { 1: { make: "Make is required" } }
  const rowErrors = {};
  v.compatibility.forEach((c, i) => {
    if (isBlankVehicle(c)) return;
    const r = {};
    const make = c.make.trim();
    const from = String(c.yearFrom).trim();
    const to = String(c.yearTo).trim();
    const badYear = (y) => !/^\d{4}$/.test(y) || Number(y) < 1950 || Number(y) > YEAR_MAX;

    if (!make) r.make = "Make is required";
    else if (make.length > 60) r.make = "Make must be 60 characters or fewer";
    if (c.model.trim().length > 60) r.model = "Model must be 60 characters or fewer";
    if (from !== "" && badYear(from)) r.yearFrom = `Years must be between 1950 and ${YEAR_MAX}`;
    if (to !== "" && badYear(to)) r.yearTo = `Years must be between 1950 and ${YEAR_MAX}`;
    if (!r.yearFrom && !r.yearTo && from !== "" && to !== "" && Number(from) > Number(to))
      r.yearTo = 'The "to" year cannot be before the "from" year';

    if (Object.keys(r).length) rowErrors[i] = r;
  });
  if (Object.keys(rowErrors).length) e.compatibility = rowErrors;

  return e;
}

