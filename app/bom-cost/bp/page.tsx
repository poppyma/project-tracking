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
    <div className="p-6 flex justify-center">
      <div className="w-full max-w-lg">

        {/* TITLE */}
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Data BP
        </h2>

        {/* FORM */}
        <form
          onSubmit={submitBP}
          className="flex gap-2 mb-4"
        >
          <input
            className="border px-3 py-2 rounded w-32 text-sm focus:ring-2 focus:ring-blue-400"
            placeholder="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          />

          <input
            className="border px-3 py-2 rounded flex-1 text-sm focus:ring-2 focus:ring-blue-400"
            placeholder="BP Value (2.301)"
            value={bpValue}
            onChange={(e) => setBpValue(e.target.value)}
          />

          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded text-sm"
          >
            Add
          </button>
        </form>

        {/* TABLE CARD */}
        <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">
                  Currency
                </th>
                <th className="px-4 py-2 text-right">
                  BP
                </th>
              </tr>
            </thead>

            <tbody>
              {bps.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Belum ada data
                  </td>
                </tr>
              ) : (
                bps.map((bp) => (
                  <tr
                    key={bp.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="px-4 py-2 font-medium">
                      {bp.currency}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {bp.bp_value}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
