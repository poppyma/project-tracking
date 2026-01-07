"use client";

import { useEffect, useState } from "react";

type IPD = {
  id: string;
  ipd_siis: string;
  fb_type: string;
  commodity: string;
  ipd_quotation: string;
};

const PAGE_SIZE = 50;
const FB_TYPES = ["DGBB", "HBU-1"];
const COMMODITIES = ["Cage", "Ring", "Balls", "Seal", "Shield"];

export default function InputIPDPage() {
  const [data, setData] = useState<IPD[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterFb, setFilterFb] = useState("");
  const [filterCommodity, setFilterCommodity] = useState("");

  const [form, setForm] = useState({
    ipd_siis: "",
    fb_type: "",
    commodity: "",
    ipd_quotation: "",
  });

  /* LOAD DATA */
  async function loadData() {
    try {
      const res = await fetch("/api/ipd");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      alert("Gagal mengambil data IPD");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [search, filterFb, filterCommodity]);

  /* SAVE */
  async function handleSubmit() {
    if (!form.ipd_siis) {
      alert("IPD SIIS wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/ipd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      alert("Data berhasil disimpan");
      resetForm();
      loadData();
    } catch {
      alert("Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      ipd_siis: "",
      fb_type: "",
      commodity: "",
      ipd_quotation: "",
    });
    setEditId(null);
    setShowForm(false);
  }

  /* FILTER */
  const filtered = data.filter((row) => {
    const s = search.toLowerCase();
    return (
      row.ipd_siis.toLowerCase().includes(s) &&
      (filterFb ? row.fb_type === filterFb : true) &&
      (filterCommodity ? row.commodity === filterCommodity : true)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pagedData = filtered.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  );

  return (
    <div className="space-y-2">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-sm font-semibold">IPD Master</h1>

        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white"
          disabled={loading}
        >
          {showForm ? "Close" : "+ Add IPD"}
        </button>
      </div>

      {/* FILTER */}
      <div className="flex gap-2 text-xs">
        <input
          className="input-dense w-48"
          placeholder="Search IPD"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="input-dense w-32"
          value={filterFb}
          onChange={(e) => setFilterFb(e.target.value)}
        >
          <option value="">All FB</option>
          {FB_TYPES.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>

        <select
          className="input-dense w-40"
          value={filterCommodity}
          onChange={(e) => setFilterCommodity(e.target.value)}
        >
          <option value="">All Commodity</option>
          {COMMODITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="bg-white border rounded p-3 grid grid-cols-2 gap-2 text-xs">
          <input
            className="input-dense"
            placeholder="IPD SIIS"
            value={form.ipd_siis}
            onChange={(e) =>
              setForm({ ...form, ipd_siis: e.target.value })
            }
          />

          <select
            className="input-dense"
            value={form.fb_type}
            onChange={(e) =>
              setForm({ ...form, fb_type: e.target.value })
            }
          >
            <option value="">FB Type</option>
            {FB_TYPES.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>

          <select
            className="input-dense"
            value={form.commodity}
            onChange={(e) =>
              setForm({ ...form, commodity: e.target.value })
            }
          >
            <option value="">Commodity</option>
            {COMMODITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <input
            className="input-dense col-span-2"
            placeholder="IPD Quotation"
            value={form.ipd_quotation}
            onChange={(e) =>
              setForm({ ...form, ipd_quotation: e.target.value })
            }
          />

          <div className="col-span-2 flex justify-end gap-2">
            <button onClick={resetForm} className="px-3 py-1 border rounded">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-1 bg-blue-600 text-white rounded"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white border rounded p-3">
        <table className="w-full border text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">No</th>
              <th className="border px-2 py-1">IPD SIIS</th>
              <th className="border px-2 py-1">FB Type</th>
              <th className="border px-2 py-1">Commodity</th>
              <th className="border px-2 py-1">IPD Quotation</th>
            </tr>
          </thead>

          <tbody>
            {pagedData.map((r, i) => (
              <tr key={r.id}>
                <td className="border px-2 py-1 text-center">
                  {page * PAGE_SIZE + i + 1}
                </td>
                <td className="border px-2 py-1">{r.ipd_siis}</td>
                <td className="border px-2 py-1">{r.fb_type}</td>
                <td className="border px-2 py-1">{r.commodity}</td>
                <td className="border px-2 py-1">{r.ipd_quotation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
