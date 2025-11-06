import type { ButtonHTMLAttributes } from "react";
export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className="", ...rest } = props;
  return (
    <button
      {...rest}
      className={`px-3 py-2 rounded-lg font-medium transition ${className}`}
    />
  );
}
