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

  async function loadData() {
    const res = await fetch("/api/ipd");
    const json = await res.json();
    setData(json);
  }

  useEffect(() => {
    loadData();
  }, []);

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
    <div className="space-y-10">

      {/* ================= INPUT CARD ================= */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">

        <div>
          <h1 className="text-xl font-semibold">IPD Master</h1>
          <p className="text-sm text-gray-500">
            Input master data IPD yang akan digunakan pada proses quotation
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">

          <div>
            <label className="label">IPD SIIS</label>
            <input
              className="input"
              value={form.ipd_siis}
              onChange={(e) =>
                setForm({ ...form, ipd_siis: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">FB Type</label>
            <input
              className="input"
              value={form.fb_type}
              onChange={(e) =>
                setForm({ ...form, fb_type: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Description</label>
            <input
              className="input"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label">Commodity</label>
            <input
              className="input"
              value={form.commodity}
              onChange={(e) =>
                setForm({ ...form, commodity: e.target.value })
              }
            />
          </div>

          <div className="col-span-2">
            <label className="label">IPD Quotation</label>
            <input
              className="input"
              value={form.ipd_quotation}
              onChange={(e) =>
                setForm({ ...form, ipd_quotation: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save IPD"}
          </button>
        </div>
      </div>

      {/* ================= TABLE CARD ================= */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">

        <h2 className="text-lg font-semibold">IPD List</h2>

        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left">IPD SIIS</th>
                <th className="border px-3 py-2 text-left">Description</th>
                <th className="border px-3 py-2 text-left">FB Type</th>
                <th className="border px-3 py-2 text-left">Commodity</th>
                <th className="border px-3 py-2 text-left">IPD Quotation</th>
              </tr>
            </thead>

            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-400">
                    No data available
                  </td>
                </tr>
              )}

              {data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">{row.ipd_siis}</td>
                  <td className="border px-3 py-2">{row.description}</td>
                  <td className="border px-3 py-2">{row.fb_type}</td>
                  <td className="border px-3 py-2">{row.commodity}</td>
                  <td className="border px-3 py-2">{row.ipd_quotation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
