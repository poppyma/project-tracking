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
  <div className="space-y-2">

    {/* INPUT */}
    <div className="bg-white border rounded p-3">

      <div className="mb-2">
        <h1 className="text-sm font-semibold">IPD Master</h1>
      </div>

      <div className="grid grid-cols-2 gap-2">

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

      <div className="flex justify-end mt-2">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>

    {/* TABLE */}
    <div className="bg-white border rounded p-3">

      <h2 className="text-xs font-semibold mb-1">IPD List</h2>

      <div className="overflow-x-auto">
        <table className="w-full border text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-[3px] text-left">IPD SIIS</th>
              <th className="border px-2 py-[3px] text-left">Description</th>
              <th className="border px-2 py-[3px] text-left">FB Type</th>
              <th className="border px-2 py-[3px] text-left">Commodity</th>
              <th className="border px-2 py-[3px] text-left">IPD Quotation</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-2 text-gray-400">
                  No data
                </td>
              </tr>
            )}

            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="border px-2 py-[3px]">{row.ipd_siis}</td>
                <td className="border px-2 py-[3px]">{row.description}</td>
                <td className="border px-2 py-[3px]">{row.fb_type}</td>
                <td className="border px-2 py-[3px]">{row.commodity}</td>
                <td className="border px-2 py-[3px]">{row.ipd_quotation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  </div>
);

}
