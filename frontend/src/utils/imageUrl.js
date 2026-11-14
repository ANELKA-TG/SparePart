// Uploaded images are stored as "/uploads/xyz.jpg" and need the backend address in front.
// Full URLs (like older pasted ones) are left as they are.
const API_ORIGIN = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");

export const imageUrl = (src) => {
  if (!src) return "";
  return /^https?:\/\//i.test(src) ? src : `${API_ORIGIN}${src}`;
};