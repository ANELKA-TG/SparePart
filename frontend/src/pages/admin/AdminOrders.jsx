import { useEffect, useState } from "react";
import api from "../../services/api";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/orders")
      .then(({ data }) => setOrders(data))
      .catch(() => setError("Could not load orders"))
      .finally(() => setLoading(false));
  }, []);

  const changeStatus = async (order, status) => {
    if (status === order.status) return;
    if (status === "cancelled" && !window.confirm("Cancel this order? Stock will be restored."))
      return;
    setError("");
    try {
      const { data } = await api.put(`/orders/${order._id}/status`, { status });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === order._id
            ? { ...o, status: data.status, isPaid: data.isPaid, paidAt: data.paidAt }
            : o
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Could not update status");
    }
  };

  const visible = filter ? orders.filter((o) => o.status === filter) : orders;

  return (
    <div>
      <div className="admin-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All orders ({orders.length})</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s} ({orders.filter((o) => o.status === s).length})
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && visible.length === 0 && <p>No orders found.</p>}

      {visible.map((o) => (
        <details className="admin-order" key={o._id}>
          <summary>
            <span>
              <strong>#{o._id.slice(-6).toUpperCase()}</strong>{" "}
              <span className="muted">
                {o.user?.name || "Deleted user"} · {new Date(o.createdAt).toLocaleString()}
              </span>
            </span>
            <span className="order-right">
              <span className={`badge ${o.status}`}>{o.status}</span>
              <strong>{o.total.toLocaleString()} FCFA</strong>
            </span>
          </summary>

          <div className="admin-order-body">
            <h4>Items</h4>
            {o.items.map((i) => (
              <div className="summary-row" key={i.product}>
                <span>
                  {i.name} <span className="muted">({i.partNumber})</span> × {i.qty}
                </span>
                <span>{(i.price * i.qty).toLocaleString()} FCFA</span>
              </div>
            ))}

            <h4>Delivery</h4>
            <p>
              {o.shippingInfo.fullName} · {o.shippingInfo.phone}<br />
              {o.shippingInfo.address}, {o.shippingInfo.city}
              {o.shippingInfo.notes && (
                <><br /><span className="muted">Note: {o.shippingInfo.notes}</span></>
              )}
            </p>

            <p className="muted">
              Payment: cash on delivery · {o.isPaid ? "Paid" : "Not yet paid"}
            </p>

            <label>
              Status:{" "}
              <select
                value={o.status}
                disabled={o.status === "cancelled" || o.status === "delivered"}
                onChange={(e) => changeStatus(o, e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        </details>
      ))}
    </div>
  );
}