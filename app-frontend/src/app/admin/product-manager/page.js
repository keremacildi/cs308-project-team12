"use client";
import { useRouter } from "next/navigation";

export default function ProductManagerHomePage() {
  const router = useRouter();

  const pages = [
    { label: "Manage Products", path: "/admin/product-manager/products" },
    { label: "Manage Categories", path: "/admin/product-manager/categories" },
    { label: "Manage Stock", path: "/admin/product-manager/stocks" },
    { label: "Manage Deliveries", path: "/admin/product-manager/deliveries" },
    { label: "Approve Comments", path: "/admin/product-manager/comments" }
  ];

  return (
    <div style={{ padding: 32 }}>
      <h1>Product Manager Panel</h1>
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
