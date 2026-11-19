import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import useForm from "../hooks/useForm";
import Field from "../components/Field";
import { validateCheckout } from "../utils/validators";

export default function Checkout() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const { values, errors, handleChange, handleBlur, handleSubmit, submitting, formError } =
    useForm(
      { fullName: user?.name || "", phone: "", city: "", address: "", notes: "" },
      validateCheckout
    );

  const onSubmit = handleSubmit(async (form) => {
    const { data } = await api.post("/orders", {
      items: items.map((i) => ({ product: i._id, qty: i.qty })),
      shippingInfo: form,
    });
    clearCart();
    navigate(`/orders/${data._id}`, { replace: true });
  });

  if (items.length === 0)
    return (
      <div className="container">
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
      </div>
    );

  const field = (name) => ({
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    "aria-invalid": !!errors[name],
  });

  return (
    <div className="container">
      <h1>Checkout</h1>
      <div className="checkout-grid">
        <form onSubmit={onSubmit} className="form" noValidate>
          <h3>Delivery details</h3>

          <Field label="Full name" error={errors.fullName}>
            <input {...field("fullName")} autoComplete="name" />
          </Field>

          <Field
            label="Phone number"
            error={errors.phone}
            hint="The courier will call this number. e.g. 6XX XX XX XX"
          >
            <input {...field("phone")} type="tel" inputMode="tel" autoComplete="tel" />
          </Field>

          <Field label="City" error={errors.city}>
            <input {...field("city")} autoComplete="address-level2" />
          </Field>

          <Field label="Delivery address / neighbourhood" error={errors.address}>
            <input {...field("address")} autoComplete="street-address" />
          </Field>

          <Field label="Notes (optional)" error={errors.notes}>
            <textarea {...field("notes")} rows={3} maxLength={300} />
          </Field>

          <h3>Payment</h3>
          <p className="pay-box">Cash on delivery: you pay when you receive your parts.</p>

          {errors.items && <p className="error" role="alert">{errors.items}</p>}
          {formError && <p className="error" role="alert">{formError}</p>}
          <button className="btn" disabled={submitting}>
            {submitting ? "Placing order..." : "Place order"}
          </button>
        </form>

        <div className="summary">
          <h3>Order summary</h3>
          {items.map((i) => (
            <div className="summary-row" key={i._id}>
              <span>{i.name} × {i.qty}</span>
              <span>{(i.price * i.qty).toLocaleString()} FCFA</span>
            </div>
          ))}
          <div className="summary-row total">
            <span>Total</span>
            <span>{totalPrice.toLocaleString()} FCFA</span>
          </div>
        </div>
      </div>
    </div>
  );
}