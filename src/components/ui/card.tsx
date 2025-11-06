import type { ReactNode } from "react";
export function Card({ className="", children }:{className?:string; children:ReactNode}) {
  return <div className={`rounded-2xl border ${className}`}>{children}</div>;
}
export function CardContent({ className="", children }:{className?:string; children:ReactNode}) {
  return <div className={className}>{children}</div>;
}
