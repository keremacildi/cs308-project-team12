"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function RevenueProfitChart({ data }) {
  return (
    <div className="w-full h-96 bg-white rounded-lg shadow p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#2563eb" name="Revenue" />
          <Line type="monotone" dataKey="profit" stroke="#16a34a" name="Profit" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}