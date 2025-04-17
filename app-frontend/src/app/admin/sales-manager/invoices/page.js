"use client";
import { useState } from "react";

export default function InvoiceManagerPage() {
  const [invoices] = useState([
    { id: 101, user: "Alice", total: 120.50, date: "2025-04-17" },
    { id: 102, user: "Bob", total: 240.00, date: "2025-04-16" }
  ]);

  const handleDownload = (invoiceId) => {
    alert(`Downloading invoice #${invoiceId} as PDF...`);
    // simulate actual file generation
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Invoices</h2>
      <ul>
        {invoices.map(inv => (
          <li key={inv.id}>
            Invoice #{inv.id} – {inv.user} – ${inv.total} – {inv.date}
            <button onClick={() => handleDownload(inv.id)} style={{ marginLeft: 8 }}>Download PDF</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
