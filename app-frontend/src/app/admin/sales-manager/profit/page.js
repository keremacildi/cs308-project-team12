"use client";
import { useState } from "react";

export default function ProfitAnalysisPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [results, setResults] = useState(null);

  const calculateProfit = () => {
    // mock profit calculation
    setResults({
      revenue: 10000,
      cost: 6000,
      profit: 4000
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Profit & Loss Analysis</h2>
      <label>From: </label>
      <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
      <label style={{ marginLeft: 16 }}>To: </label>
      <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
      <button onClick={calculateProfit} style={{ marginLeft: 16 }}>Analyze</button>

      {results && (
        <div style={{ marginTop: 20 }}>
          <p>Revenue: ${results.revenue}</p>
          <p>Cost: ${results.cost}</p>
          <p><strong>Profit: ${results.profit}</strong></p>
        </div>
      )}
    </div>
  );
}
