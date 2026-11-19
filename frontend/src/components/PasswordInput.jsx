import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "./Icons";

export default function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-wrap">
      <input {...props} type={show ? "text" : "password"} />
      <button
        type="button"
        className="eye"
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow((s) => !s)}
      >
        {show ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </div>
  );
}