import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useForm from "../hooks/useForm";
import Field from "../components/Field";
import PasswordInput from "../components/PasswordInput";
import { validateLogin } from "../utils/validators";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { values, errors, handleChange, handleBlur, handleSubmit, submitting, formError } =
    useForm({ email: "", password: "" }, validateLogin);

  const onSubmit = handleSubmit(async ({ email, password }) => {
    await login(email.trim(), password);
    navigate(location.state?.from || "/");
  });

  return (
    <div className="container narrow">
      <h1>Login</h1>
      <form onSubmit={onSubmit} className="form" noValidate>
        <Field label="Email" error={errors.email}>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={!!errors.email}
          />
        </Field>

        <Field label="Password" error={errors.password}>
          <PasswordInput
            name="password"
            autoComplete="current-password"
            placeholder="............."
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={!!errors.password}
          />
        </Field>

        {formError && <p className="error" role="alert">{formError}</p>}
        <button className="btn" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </button>
      </form>
      <p>No account? <Link to="/register"><u>Register</u></Link></p>
    </div>
  );
}