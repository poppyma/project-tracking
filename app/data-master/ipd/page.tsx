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

const PAGE_SIZE = 50;

export default function InputIPDPage() {
  const [data, setData] = useState<IPD[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    ipd_siis: "",
    description: "",
    fb_type: "",
    commodity: "",
    ipd_quotation: "",
  });

  /* ================= LOAD DATA ================= */
  async function loadData() {
    const res = await fetch("/api/ipd");
    const json = await res.json();
    setData(json);
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [data]);

  /* ================= SUBMIT ================= */
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

    setShowForm(false);
    loadData();
  }

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(data.length / PAGE_SIZE);

  const pagedData = data.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  );

  /* ================= RENDER ================= */
  return (
    <div className="space-y-2">

      {/* ===== HEADER ACTION ===== */}
      <div className="flex justify-between items-center">
        <h1 className="text-sm font-semibold">IPD Master</h1>

        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          {showForm ? "Close Form" : "+ Add IPD"}
        </button>
      </div>

      {/* ===== FORM INPUT (TOGGLE) ===== */}
      {showForm && (
        <div className="bg-white border rounded p-3">

          <div className="grid grid-cols-2 gap-2">

            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-[2px]">
                IPD SIIS
              </label>
              <input
                className="input-dense"
                value={form.ipd_siis}
                onChange={(e) =>
                  setForm({ ...form, ipd_siis: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-[2px]">
                FB Type
              </label>
              <input
                className="input-dense"
                value={form.fb_type}
                onChange={(e) =>
                  setForm({ ...form, fb_type: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-[2px]">
                Description
              </label>
              <input
                className="input-dense"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-[2px]">
                Commodity
              </label>
              <input
                className="input-dense"
                value={form.commodity}
                onChange={(e) =>
                  setForm({ ...form, commodity: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-[2px]">
                IPD Quotation
              </label>
              <input
                className="input-dense"
                value={form.ipd_quotation}
                onChange={(e) =>
                  setForm({ ...form, ipd_quotation: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end mt-2 gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs border rounded"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* ===== TABLE ===== */}
      <div className="bg-white border rounded p-3">

        <h2 className="text-xs font-semibold mb-1">
          IPD List ({data.length})
        </h2>

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
              {pagedData.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-2 text-gray-400">
                    No data
                  </td>
                </tr>
              )}

              {pagedData.map((row) => (
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

        {/* ===== PAGINATION ===== */}
        <div className="flex justify-between items-center mt-2 text-xs">
          <div>
            Page {page + 1} of {totalPages || 1}
          </div>

          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>

            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
