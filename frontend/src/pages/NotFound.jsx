import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container center">
      <h1>404</h1>
      <p>We couldn't find that page.</p>
      <Link to="/" className="btn">Back to products</Link>
    </div>
  );
}