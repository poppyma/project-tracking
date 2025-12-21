"use client";

import { useEffect, useState } from "react";

type IPD = {
  id: string;
  ipd_siis: string;
  description: string;
  fb_type: string;
  commodity: string;
  ipd_quotation: string;
  created_at: string;
};

export default function InputIPDPage() {
  const [data, setData] = useState<IPD[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    ipd_siis: "",
    description: "",
    fb_type: "",
    commodity: "",
    ipd_quotation: "",
  });

  /* =========================
     Load Data
  ========================= */
  async function loadData() {
    const res = await fetch("/api/ipd");
    const json = await res.json();
    setData(json);
  }

  useEffect(() => {
    loadData();
  }, []);

  /* =========================
     Submit Form
  ========================= */
  async function handleSubmit() {
    if (!form.ipd_siis) {
      alert("IPD SIIS wajib diisi");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/ipd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      alert("Gagal menyimpan data IPD");
      return;
    }

    setForm({
      ipd_siis: "",
      description: "",
      fb_type: "",
      commodity: "",
      ipd_quotation: "",
    });

    loadData();
  }

  return (
    <div className="space-y-6">

      {/* TITLE */}
      <h1 className="text-2xl font-bold">Input IPD</h1>

      {/* FORM */}
      <div className="grid grid-cols-5 gap-4">
        <input
          className="input"
          placeholder="IPD SIIS"
          value={form.ipd_siis}
          onChange={(e) =>
            setForm({ ...form, ipd_siis: e.target.value })
          }
        />

        <input
          className="input"
          placeholder="Description"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        <input
          className="input"
          placeholder="FB Type"
          value={form.fb_type}
          onChange={(e) =>
            setForm({ ...form, fb_type: e.target.value })
          }
        />

        <input
          className="input"
          placeholder="Commodity"
          value={form.commodity}
          onChange={(e) =>
            setForm({ ...form, commodity: e.target.value })
          }
        />

        <input
          className="input"
          placeholder="IPD Quotation"
          value={form.ipd_quotation}
          onChange={(e) =>
            setForm({ ...form, ipd_quotation: e.target.value })
          }
        />
      </div>

      {/* SAVE BUTTON */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save"}
      </button>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">IPD SIIS</th>
              <th className="border px-2 py-1">Description</th>
              <th className="border px-2 py-1">FB Type</th>
              <th className="border px-2 py-1">Commodity</th>
              <th className="border px-2 py-1">IPD Quotation</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-4 text-gray-400"
                >
                  No data
                </td>
              </tr>
            )}

            {data.map((row) => (
              <tr key={row.id}>
                <td className="border px-2 py-1">{row.ipd_siis}</td>
                <td className="border px-2 py-1">{row.description}</td>
                <td className="border px-2 py-1">{row.fb_type}</td>
                <td className="border px-2 py-1">{row.commodity}</td>
                <td className="border px-2 py-1">{row.ipd_quotation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
