import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
}

/**
 * Six separate boxes for the verification code, the way the merchant dashboard's
 * vue3-otp-input renders it. Typing advances, Backspace retreats, and a pasted code
 * fills every box at once.
 */
export function OtpInput({ value, onChange, length = 6, autoFocus = true, disabled }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(() => toDigits(value, length));

  // The parent clears the code after a resend; follow it.
  useEffect(() => {
    if (value === "" && digits.some(Boolean)) setDigits(Array(length).fill(""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const commit = (next: string[]) => {
    setDigits(next);
    onChange(next.join(""));
  };

  const focus = (index: number) => {
    refs.current[Math.max(0, Math.min(length - 1, index))]?.focus();
  };

  const fillFrom = (start: number, text: string) => {
    const clean = text.replace(/\D/g, "");
    if (!clean) return;
    const next = [...digits];
    let cursor = start;
    for (const ch of clean) {
      if (cursor >= length) break;
      next[cursor] = ch;
      cursor += 1;
    }
    commit(next);
    focus(cursor >= length ? length - 1 : cursor);
  };

  const handleChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      const next = [...digits];
      next[index] = "";
      commit(next);
      return;
    }
    // The box is selected on focus, so a keystroke normally arrives alone; anything
    // longer is a paste or an autofill and spreads across the boxes.
    fillFrom(index, clean.slice(-Math.max(1, clean.length)));
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      commit(next);
      focus(index - 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focus(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focus(index + 1);
    }
  };

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    fillFrom(index, event.clipboardData.getData("text"));
  };

  return (
    <div role="group" aria-label="Verification code" className="flex justify-center gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1}`}
          placeholder="0"
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          onFocus={(e) => e.target.select()}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          className="otp-input-v2"
        />
      ))}
    </div>
  );
}

function toDigits(value: string, length: number): string[] {
  return Array.from({ length }, (_, i) => value[i] ?? "");
}
