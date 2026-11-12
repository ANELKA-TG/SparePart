import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="container">
      <h1>Admin dashboard</h1>
      <div className="admin-tabs">
        <NavLink to="/admin/products">Products</NavLink>
        <NavLink to="/admin/orders">Orders</NavLink>
      </div>
      <Outlet />
    </div>
  );
}