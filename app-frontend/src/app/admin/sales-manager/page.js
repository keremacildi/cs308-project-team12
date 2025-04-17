"use client";
import { useRouter } from "next/navigation";

export default function SalesManagerHomePage() {
  const router = useRouter();

  const pages = [
    { label: "Manage Prices", path: "/admin/sales-manager/prices" },
    { label: "Manage Discounts", path: "/admin/sales-manager/discounts" },
    { label: "Invoices", path: "/admin/sales-manager/invoices" },
    { label: "Profit Analysis", path: "/admin/sales-manager/profit" }
  ];

  return (
    <div style={{ padding: 32 }}>
      <h1>Sales Manager Panel</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
        {pages.map((p, index) => (
          <button
            key={index}
            onClick={() => router.push(p.path)}
            style={{
              padding: "14px 24px",
              fontSize: "16px",
              backgroundColor: "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
