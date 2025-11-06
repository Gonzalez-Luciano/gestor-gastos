import type { InputHTMLAttributes } from "react";
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className="", ...rest } = props;
  return (
    <input
      {...rest}
      className={`rounded-lg px-3 py-2 outline-none transition ${className}`}
    />
  );
}
