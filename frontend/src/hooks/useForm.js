import { useState } from "react";

export default function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const clientErrors = validate(values);

  // Show an error once the field was visited, or after a submit attempt
  const errors = {};
  for (const key of Object.keys(clientErrors)) {
    if (submitted || touched[key]) errors[key] = clientErrors[key];
  }
  for (const key of Object.keys(serverErrors)) {
    if (!errors[key]) errors[key] = serverErrors[key];
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((v) => ({ ...v, [name]: type === "checkbox" ? checked : value }));
    setServerErrors((prev) => {
      const next = { ...prev };
      delete next[name]; // typing in a field clears its server error
      return next;
    });
    setFormError("");
  };

  const handleBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const handleSubmit = (onValid) => async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormError("");
    setServerErrors({});

    const keys = Object.keys(clientErrors);
    if (keys.length) {
      // Jump to the first problem: an input with that name, or a section with that id
      const target = document.getElementsByName(keys[0])[0] || document.getElementById(keys[0]);
      if (target) {
        target.scrollIntoView?.({ block: "center", behavior: "smooth" });
        target.focus?.({ preventScroll: true });
      }
      return;
    }

    setSubmitting(true);
    try {
      await onValid(values);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setServerErrors(data.errors);
      setFormError(data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    values,
    setValues,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
    submitting,
    // When errors are already shown under fields, skip the general message
    formError: Object.keys(serverErrors).length ? "" : formError,
  };
}