import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
}

/** A password field with the show/hide eye the merchant dashboard uses. */
export function PasswordInput({ id, value, onChange, placeholder, autoComplete, required }: Props) {
  const [show, setShow] = useState(false);
  const Icon = show ? EyeOff : Eye;

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="input-field pr-10"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? "Hide" : "Show"}
        onClick={() => setShow((s) => !s)}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-gray cursor-pointer"
      >
        <Icon size={18} strokeWidth={2.2} />
      </button>
    </div>
  );
}
