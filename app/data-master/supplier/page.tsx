"use client";

import { useEffect, useState } from "react";

type Supplier = {
  id: string;
  supplier_code: string;
  supplier_name: string;
  address: string;
  country: string;
  pic: string;
  email: string;
  category: string;
  currency: string;
  incoterm: string;
  top: number;
  forwarder: string;
};

const PAGE_SIZE = 50;

export default function InputSupplierPage() {
  const [data, setData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    supplier_code: "",
    supplier_name: "",
    address: "",
    country: "",
    pic: "",
    email: "",
    category: "",
    currency: "",
    incoterm: "",
    top: "",
    forwarder: "",
  });

  /* ================= LOAD DATA ================= */
  async function loadData() {
    try {
      const res = await fetch("/api/supplier");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      alert("Gagal mengambil data supplier");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* ================= SAVE / UPDATE ================= */
  async function handleSubmit() {
    if (!form.supplier_code || !form.supplier_name) {
      alert("Supplier Code & Name wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const url = editId
        ? `/api/supplier/${editId}`
        : "/api/supplier";

      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          top: form.top ? Number(form.top) : null,
        }),
      });

      if (!res.ok) throw new Error();

      alert(editId ? "Supplier berhasil diupdate" : "Supplier berhasil disimpan");
      resetForm();
      loadData();
    } catch {
      alert("Gagal menyimpan supplier");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      supplier_code: "",
      supplier_name: "",
      address: "",
      country: "",
      pic: "",
      email: "",
      category: "",
      currency: "",
      incoterm: "",
      top: "",
      forwarder: "",
    });
    setEditId(null);
    setShowForm(false);
  }

  /* ================= DELETE ================= */
  async function handleDelete(id: string) {
    if (!confirm("Yakin hapus supplier ini?")) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/supplier/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      alert("Supplier berhasil dihapus");
      loadData();
    } catch {
      alert("Gagal menghapus supplier");
    } finally {
      setLoading(false);
    }
  }

  /* ================= EDIT ================= */
  function handleEdit(row: Supplier) {
    setForm({
      supplier_code: row.supplier_code,
      supplier_name: row.supplier_name,
      address: row.address,
      country: row.country,
      pic: row.pic,
      email: row.email,
      category: row.category,
      currency: row.currency,
      incoterm: row.incoterm,
      top: row.top?.toString() ?? "",
      forwarder: row.forwarder,
    });
    setEditId(row.id);
    setShowForm(true);
  }

  /* ================= FILTER ================= */
  const filtered = data.filter((row) => {
    const s = search.toLowerCase();
    return (
      row.supplier_code.toLowerCase().includes(s) ||
      row.supplier_name.toLowerCase().includes(s)
    );
  });

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
        <h1 className="text-sm font-semibold">Supplier Master</h1>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setEditId(null);
          }}
          className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white"
          disabled={loading}
        >
          {showForm ? "Close" : "+ Add Supplier"}
        </button>
      </div>

      {/* SEARCH */}
      <input
        className="input-dense w-64 text-xs"
        placeholder="Search Supplier Code / Name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* FORM */}
      {showForm && (
        <div className="bg-white border rounded p-3 grid grid-cols-4 gap-2 text-xs">

          <input className="input-dense" placeholder="Supplier Code"
            value={form.supplier_code}
            onChange={(e) => setForm({ ...form, supplier_code: e.target.value })}
          />
          <input className="input-dense" placeholder="Supplier Name"
            value={form.supplier_name}
            onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
          />
          <input className="input-dense" placeholder="Country"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
          <input className="input-dense" placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <input className="input-dense" placeholder="PIC"
            value={form.pic}
            onChange={(e) => setForm({ ...form, pic: e.target.value })}
          />
          <input className="input-dense" placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input className="input-dense" placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <input className="input-dense" placeholder="Currency"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          />

          <input className="input-dense" placeholder="Incoterm"
            value={form.incoterm}
            onChange={(e) => setForm({ ...form, incoterm: e.target.value })}
          />
          <input className="input-dense" type="number" placeholder="TOP"
            value={form.top}
            onChange={(e) => setForm({ ...form, top: e.target.value })}
          />
          <input className="input-dense col-span-2" placeholder="Forwarder"
            value={form.forwarder}
            onChange={(e) => setForm({ ...form, forwarder: e.target.value })}
          />

          <div className="col-span-4 flex justify-end gap-2">
            <button onClick={resetForm} className="px-3 py-1 border rounded">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {loading ? "Saving..." : editId ? "Update" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white border rounded p-3">
        <table className="w-full border text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1 text-center w-10">No</th>
              <th className="border px-2 py-1">Supplier Code</th>
              <th className="border px-2 py-1">Supplier Name</th>
              <th className="border px-2 py-1">Address</th>
              <th className="border px-2 py-1">Country</th>
              <th className="border px-2 py-1">PIC</th>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Category</th>
              <th className="border px-2 py-1">Currency</th>
              <th className="border px-2 py-1">Incoterm</th>
              <th className="border px-2 py-1">TOP</th>
              <th className="border px-2 py-1">Forwarder</th>
              <th className="border px-2 py-1 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {pagedData.map((r, i) => (
              <tr key={r.id}>
                <td className="border px-2 py-1 text-center">
                  {page * PAGE_SIZE + i + 1}
                </td>
                <td className="border px-2 py-1">{r.supplier_code}</td>
                <td className="border px-2 py-1">{r.supplier_name}</td>
                <td className="border px-2 py-1">{r.address}</td>
                <td className="border px-2 py-1">{r.country}</td>
                <td className="border px-2 py-1">{r.pic}</td>
                <td className="border px-2 py-1">{r.email}</td>
                <td className="border px-2 py-1">{r.category}</td>
                <td className="border px-2 py-1">{r.currency}</td>
                <td className="border px-2 py-1">{r.incoterm}</td>
                <td className="border px-2 py-1">{r.top}</td>
                <td className="border px-2 py-1">{r.forwarder}</td>

                <td className="border px-2 py-1">
                  <div className="flex justify-center gap-2">
                    <button
                      title="Edit"
                      onClick={() => handleEdit(r)}
                      className="p-1 rounded hover:bg-blue-100"
                    >
                      ✏️
                    </button>
                    <button
                      title="Delete"
                      onClick={() => handleDelete(r.id)}
                      className="p-1 rounded hover:bg-red-100"
                    >
                      🗑️
                    </button>
                  </div>
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
