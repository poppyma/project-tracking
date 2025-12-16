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

      {/* PAGE HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Data BP
        </h1>
        <p className="text-sm text-gray-500">
          Master data BP berdasarkan currency
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-2xl space-y-6">

        {/* FORM CARD */}
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Tambah BP
          </h3>

          <form
            onSubmit={submitBP}
            className="flex items-end gap-3"
          >
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Currency
              </label>
              <input
                className="border px-3 py-2 rounded-lg w-28 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="USD"
                value={currency}
                onChange={(e) =>
                  setCurrency(e.target.value.toUpperCase())
                }
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">
                BP Value
              </label>
              <input
                className="border px-3 py-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="2.301"
                value={bpValue}
                onChange={(e) => setBpValue(e.target.value)}
              />
            </div>

            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium"
            >
              Add
            </button>
          </form>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="text-sm font-semibold text-gray-700">
              Daftar BP
            </h3>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">
                  Currency
                </th>
                <th className="px-4 py-3 text-right">
                  BP
                </th>
              </tr>
            </thead>

            <tbody>
              {bps.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    Belum ada data BP
                  </td>
                </tr>
              ) : (
                bps.map((bp) => (
                  <tr
                    key={bp.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {bp.currency}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
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
