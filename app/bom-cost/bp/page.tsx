"use client";

import { useEffect, useState } from "react";

type BP = {
  id: number;
  currency: string;
  bp_value: string;
};

export default function BPPage() {
  const [bps, setBps] = useState<BP[]>([]);
  const [bpForm, setBpForm] = useState({
    currency: "",
    bp_value: "",
  });

  async function loadBP() {
    const res = await fetch("/api/bp");
    const json = await res.json();
    setBps(json);
  }

  async function submitBP(e: React.FormEvent) {
    e.preventDefault();

    await fetch("/api/bp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bpForm),
    });

    setBpForm({ currency: "", bp_value: "" });
    loadBP();
  }

  useEffect(() => {
    loadBP();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Data BP</h1>

      <form onSubmit={submitBP} className="flex gap-2 mb-4">
        <input
          placeholder="Currency (USD)"
          value={bpForm.currency}
          onChange={(e) =>
            setBpForm({ ...bpForm, currency: e.target.value })
          }
          className="border px-2 py-1"
        />

        <input
          placeholder="BP Value (2.301)"
          value={bpForm.bp_value}
          onChange={(e) =>
            setBpForm({ ...bpForm, bp_value: e.target.value })
          }
          className="border px-2 py-1"
        />

        <button className="bg-blue-600 text-white px-4">
          Add
        </button>
      </form>

      <table className="border w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2">Currency</th>
            <th className="border px-2">BP</th>
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
