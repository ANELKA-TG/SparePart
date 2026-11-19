import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useForm from "../hooks/useForm";
import Field from "../components/Field";
import PasswordInput from "../components/PasswordInput";
import { CheckIcon, CircleIcon } from "../components/Icons";
import { passwordChecks, validateRegister } from "../utils/validators";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const { values, errors, handleChange, handleBlur, handleSubmit, submitting, formError } =
    useForm({ name: "", email: "", password: "", confirm: "" }, validateRegister);

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    await register(name.trim(), email.trim(), password);
    navigate("/");
  });

  const checks = passwordChecks(values.password);
  const items = [
    { ok: checks.length, label: "8+ characters" },
    { ok: checks.letter, label: "A letter" },
    { ok: checks.number, label: "A number" },
  ];

  return (
    <div className="container narrow">
      <h1>Create account</h1>
      <form onSubmit={onSubmit} className="form" noValidate>
        <Field label="Full name" error={errors.name}>
          <input
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={!!errors.name}
          />
        </Field>

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
            autoComplete="new-password"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={!!errors.password}
          />
        </Field>

        <ul className="checklist">
          {items.map((i) => (
            <li key={i.label} className={i.ok ? "ok" : ""}>
              {i.ok ? <CheckIcon size={14} /> : <CircleIcon size={14} />} {i.label}
            </li>
          ))}
        </ul>

        <Field label="Confirm password" error={errors.confirm}>
          <PasswordInput
            name="confirm"
            autoComplete="new-password"
            value={values.confirm}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={!!errors.confirm}
          />
        </Field>

        {formError && <p className="error" role="alert">{formError}</p>}
        <button className="btn" disabled={submitting}>
          {submitting ? "Creating..." : "Register"}
        </button>
      </form>
      <p>Already registered? <Link to="/login"><u>Login</u></Link></p>
    </div>
  );
}