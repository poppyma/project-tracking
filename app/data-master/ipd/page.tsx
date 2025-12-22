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
  <div className="space-y-4">

    {/* ================= INPUT CARD ================= */}
    <div className="bg-white rounded-lg border p-4">

      <div className="mb-3">
        <h1 className="text-lg font-semibold">IPD Master</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">

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

      <div className="flex justify-end mt-3">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>

    {/* ================= TABLE CARD ================= */}
    <div className="bg-white rounded-lg border p-4">

      <h2 className="text-sm font-semibold mb-2">IPD List</h2>

      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1 text-left">IPD SIIS</th>
              <th className="border px-2 py-1 text-left">Description</th>
              <th className="border px-2 py-1 text-left">FB Type</th>
              <th className="border px-2 py-1 text-left">Commodity</th>
              <th className="border px-2 py-1 text-left">IPD Quotation</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-3 text-gray-400">
                  No data
                </td>
              </tr>
            )}

            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
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
  </div>
);

}
