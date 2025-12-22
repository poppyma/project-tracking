"use client";

import { useEffect, useState } from "react";

/* =====================
   TYPE
===================== */
type PriceRow = {
  id: string;
  ipd: string;
  supplier_code: string;
  quarter: number;
  year: number;
  price: number;
  currency: string;
};

const PAGE_SIZE = 50;

/* =====================
   PAGE
===================== */
export default function PricePage() {
  const [data, setData] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const [form, setForm] = useState({
    ipd: "",
    supplier_code: "",
    quarter: "",
    year: new Date().getFullYear().toString(),
    price: "",
    currency: "",
  });

  /* =====================
     LOAD DATA
  ===================== */
  async function loadData() {
    try {
      const res = await fetch("/api/price");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      setData([]);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* =====================
     SUBMIT
  ===================== */
  async function handleSubmit() {
    if (
      !form.ipd ||
      !form.supplier_code ||
      !form.quarter ||
      !form.year ||
      !form.price
    ) {
      alert("IPD, Supplier, Quarter, Year, dan Price wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ipd: form.ipd,
          supplier_code: form.supplier_code,
          quarter: Number(form.quarter),
          year: Number(form.year),
          price: Number(form.price),
          currency: form.currency,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err?.error || "Gagal menyimpan price");
        return;
      }

      alert("Price berhasil disimpan");
      resetForm();
      loadData();
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      ipd: "",
      supplier_code: "",
      quarter: "",
      year: new Date().getFullYear().toString(),
      price: "",
      currency: "",
    });
    setShowForm(false);
  }

  /* =====================
     FILTER & PAGINATION
  ===================== */
  const filtered = data.filter(
    (r) =>
      r.ipd.toLowerCase().includes(search.toLowerCase()) ||
      r.supplier_code.toLowerCase().includes(search.toLowerCase())
  );

  const paged = filtered.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  );

  /* =====================
     RENDER
  ===================== */
  return (
    <div className="space-y-3">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-sm font-semibold">Master Price (Quarter)</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white"
        >
          {showForm ? "Close" : "+ Add Price"}
        </button>
      </div>

      {/* SEARCH */}
      <input
        className="input-dense w-64 text-xs"
        placeholder="Search IPD / Supplier"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* FORM */}
      {showForm && (
        <div className="bg-white border rounded p-3 grid grid-cols-4 gap-2 text-xs">

          <input
            className="input-dense"
            placeholder="IPD"
            value={form.ipd}
            onChange={(e) =>
              setForm({ ...form, ipd: e.target.value })
            }
          />

          <input
            className="input-dense"
            placeholder="Supplier Code"
            value={form.supplier_code}
            onChange={(e) =>
              setForm({ ...form, supplier_code: e.target.value })
            }
          />

          <select
            className="input-dense"
            value={form.quarter}
            onChange={(e) =>
              setForm({ ...form, quarter: e.target.value })
            }
          >
            <option value="">Quarter</option>
            <option value="1">Q1</option>
            <option value="2">Q2</option>
            <option value="3">Q3</option>
            <option value="4">Q4</option>
          </select>

          <input
            className="input-dense"
            placeholder="Year"
            value={form.year}
            onChange={(e) =>
              setForm({ ...form, year: e.target.value })
            }
          />

          <input
            className="input-dense"
            placeholder="Price"
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: e.target.value })
            }
          />

          <input
            className="input-dense"
            placeholder="Currency"
            value={form.currency}
            onChange={(e) =>
              setForm({ ...form, currency: e.target.value })
            }
          />

          <div className="col-span-4 flex justify-end gap-2 pt-2">
            <button
              onClick={resetForm}
              className="px-3 py-1 border rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-1 bg-blue-600 text-white rounded"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white border rounded p-3">
        <table className="w-full border text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">IPD</th>
              <th className="border px-2 py-1">Supplier</th>
              <th className="border px-2 py-1">Year</th>
              <th className="border px-2 py-1">Quarter</th>
              <th className="border px-2 py-1">Price</th>
              <th className="border px-2 py-1">Currency</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <tr key={r.id}>
                <td className="border px-2 py-1">{r.ipd}</td>
                <td className="border px-2 py-1">{r.supplier_code}</td>
                <td className="border px-2 py-1">{r.year}</td>
                <td className="border px-2 py-1">Q{r.quarter}</td>
                <td className="border px-2 py-1">{r.price}</td>
                <td className="border px-2 py-1">{r.currency ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
