import React, { type PropsWithChildren } from "react";

export function Page({ children }: PropsWithChildren) {
  return <div style={{ minHeight: "100vh", padding: 24 }}>{children}</div>;
}

export function Card({ children }: PropsWithChildren) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24,
        padding: 16,
      }}
    >
      {children}
    </div>
  );
}
