"use client";

import { useEffect, useState } from "react";

type BP = {
  id: number;
  currency: string;
  bp_value: string;
};

export default function DataBPPage() {
  const [bps, setBps] = useState<BP[]>([]);
  const [currency, setCurrency] = useState("");
  const [bpValue, setBpValue] = useState("");

  async function loadBP() {
    const res = await fetch("/api/bp");
    const json = await res.json();
    setBps(json);
  }

  useEffect(() => {
    loadBP();
  }, []);

  async function submitBP(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/bp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currency,
        bp_value: bpValue,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert("Gagal menambahkan BP: " + err.error);
      return;
    }

    setCurrency("");
    setBpValue("");
    loadBP();
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-3">Data BP</h2>

      <form onSubmit={submitBP} className="flex gap-2 mb-4">
        <input
          className="border px-3 py-2 rounded"
          placeholder="Currency (USD)"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        />
        <input
          className="border px-3 py-2 rounded"
          placeholder="BP Value (2.301)"
          value={bpValue}
          onChange={(e) => setBpValue(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-4 rounded">
          Add
        </button>
      </form>

      <table className="border w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">Currency</th>
            <th className="border px-2 py-1">BP</th>
          </tr>
        </thead>
        <tbody>
          {bps.map((bp) => (
            <tr key={bp.id}>
              <td className="border px-2">{bp.currency}</td>
              <td className="border px-2">{bp.bp_value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
