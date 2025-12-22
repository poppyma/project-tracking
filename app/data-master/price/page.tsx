"use client";

import { useEffect, useState } from "react";

type PriceRow = {
  id: string;
  ipd: string;
  description: string;
  steel_spec: string;
  material_source: string;
  tube_route: string;
  price: number;
};

const PAGE_SIZE = 50;

export default function InputPricePage() {
  const [data, setData] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    ipd: "",
    description: "",
    steel_spec: "",
    material_source: "",
    tube_route: "",
    price: "",
  });

  /* ================= LOAD ================= */
  async function loadData() {
    const res = await fetch("/api/price");
    setData(await res.json());
  }

  useEffect(() => {
    loadData();
  }, []);

  /* ================= SAVE ================= */
  async function handleSubmit() {
    if (!form.ipd || !form.price) {
      alert("IPD & Price wajib diisi");
      return;
    }

    setLoading(true);

    const url = editId ? `/api/price/${editId}` : "/api/price";
    const method = editId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      alert("Gagal menyimpan price");
      return;
    }

    alert(editId ? "Price berhasil diupdate" : "Price berhasil disimpan");
    resetForm();
    loadData();
  }

  function resetForm() {
    setForm({
      ipd: "",
      description: "",
      steel_spec: "",
      material_source: "",
      tube_route: "",
      price: "",
    });
    setEditId(null);
    setShowForm(false);
  }

  /* ================= DELETE ================= */
  async function handleDelete(id: string) {
    if (!confirm("Yakin hapus data ini?")) return;

    await fetch(`/api/price/${id}`, { method: "DELETE" });
    loadData();
  }

  function handleEdit(row: PriceRow) {
    setForm({
      ipd: row.ipd,
      description: row.description,
      steel_spec: row.steel_spec,
      material_source: row.material_source,
      tube_route: row.tube_route,
      price: row.price.toString(),
    });
    setEditId(row.id);
    setShowForm(true);
  }

  /* ================= FILTER ================= */
  const filtered = data.filter(
    (r) =>
      r.ipd.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pagedData = filtered.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  );

  /* ================= RENDER ================= */
  return (
    <div className="space-y-2">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-sm font-semibold">Price Master</h1>
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
        placeholder="Search IPD / Description"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* FORM */}
      {showForm && (
        <div className="bg-white border rounded p-3 grid grid-cols-3 gap-2 text-xs">

          <input className="input-dense" placeholder="IPD"
            value={form.ipd}
            onChange={(e) => setForm({ ...form, ipd: e.target.value })}
          />
          <input className="input-dense" placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input className="input-dense" placeholder="Steel Spec"
            value={form.steel_spec}
            onChange={(e) => setForm({ ...form, steel_spec: e.target.value })}
          />

          <input className="input-dense" placeholder="Material Source"
            value={form.material_source}
            onChange={(e) => setForm({ ...form, material_source: e.target.value })}
          />
          <input className="input-dense" placeholder="Tube Route"
            value={form.tube_route}
            onChange={(e) => setForm({ ...form, tube_route: e.target.value })}
          />
          <input className="input-dense" type="number" placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />

          <div className="col-span-3 flex justify-end gap-2">
            <button onClick={resetForm} className="px-3 py-1 border rounded">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-1 bg-blue-600 text-white rounded"
            >
              {editId ? "Update" : "Save"}
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
              <th className="border px-2 py-1">Description</th>
              <th className="border px-2 py-1">Steel</th>
              <th className="border px-2 py-1">Source</th>
              <th className="border px-2 py-1">Route</th>
              <th className="border px-2 py-1">Price</th>
              <th className="border px-2 py-1">Action</th>
            </tr>
          </thead>

          <tbody>
            {pagedData.map((r) => (
              <tr key={r.id}>
                <td className="border px-2 py-1">{r.ipd}</td>
                <td className="border px-2 py-1">{r.description}</td>
                <td className="border px-2 py-1">{r.steel_spec}</td>
                <td className="border px-2 py-1">{r.material_source}</td>
                <td className="border px-2 py-1">{r.tube_route}</td>
                <td className="border px-2 py-1">{r.price}</td>
                <td className="border px-2 py-1 text-center">
                  <button onClick={() => handleEdit(r)}>✏️</button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="ml-2 text-red-600"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="flex justify-between mt-2 text-xs">
          <span>
            Page {page + 1} of {totalPages || 1}
          </span>
          <div className="space-x-2">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>
              Prev
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
