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

  async function deleteBP(id: number) {
    if (!confirm("Hapus BP ini?")) return;

    const res = await fetch("/api/bp", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      alert("Gagal menghapus BP");
      return;
    }

    loadBP();
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Data BP
        </h1>
        <p className="text-sm text-gray-500">
          Master data BP berdasarkan currency
        </p>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* FORM */}
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">
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
                className="border px-3 py-2 rounded-lg w-28 text-sm"
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
                className="border px-3 py-2 rounded-lg w-full text-sm"
                value={bpValue}
                onChange={(e) => setBpValue(e.target.value)}
              />
            </div>

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm">
              Add
            </button>
          </form>
        </div>

        {/* TABLE */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">
                  Currency
                </th>
                <th className="px-4 py-3 text-right">
                  BP
                </th>
                <th className="px-4 py-3 text-center">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {bps.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
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
                    <td className="px-4 py-3 font-medium">
                      {bp.currency}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {bp.bp_value}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteBP(bp.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        title="Delete"
                      >
                        🗑️
                      </button>
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
