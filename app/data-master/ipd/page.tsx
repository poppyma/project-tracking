"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";

type IPD = {
  id: string;
  ipd_siis: string;
  description: string;
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
  const [uploading, setUploading] = useState(false);

  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterFb, setFilterFb] = useState("");
  const [filterCommodity, setFilterCommodity] = useState("");

  const [form, setForm] = useState({
    ipd_siis: "",
    description: "",
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

  /* SAVE / UPDATE */
  async function handleSubmit() {
    if (!form.ipd_siis) {
      alert("IPD SIIS wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const url = editId ? `/api/ipd/${editId}` : "/api/ipd";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      alert(editId ? "Data berhasil diupdate" : "Data berhasil disimpan");
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
      description: "",
      fb_type: "",
      commodity: "",
      ipd_quotation: "",
    });
    setEditId(null);
    setShowForm(false);
  }

  /* DELETE */
  async function handleDelete(id: string) {
    if (!confirm("Yakin hapus data ini?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/ipd/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();

      alert("Data berhasil dihapus");
      loadData();
    } catch {
      alert("Gagal menghapus data");
    } finally {
      setLoading(false);
    }
  }

  /* EDIT */
  function handleEdit(row: IPD) {
    setForm({
      ipd_siis: row.ipd_siis,
      description: row.description,
      fb_type: row.fb_type,
      commodity: row.commodity,
      ipd_quotation: row.ipd_quotation,
    });
    setEditId(row.id);
    setShowForm(true);
  }

  /* FILTER */
  const filtered = data.filter((row) => {
    const s = search.toLowerCase();
    return (
      (row.ipd_siis.toLowerCase().includes(s) ||
        row.description.toLowerCase().includes(s)) &&
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
      <div className="flex gap-2">
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setEditId(null);
          }}
          className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white"
          disabled={loading}
        >
          {showForm ? "Close" : "+ Add IPD"}
        </button>

        <label className="px-3 py-1.5 text-xs rounded bg-green-600 text-white cursor-pointer">
          {uploading ? "Uploading..." : "Upload File"}
          <input
            type="file"
            accept=".csv"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const formData = new FormData();
              formData.append("file", file);

              setUploading(true);
              try {
                const res = await fetch("/api/ipd/upload", {
                  method: "POST",
                  body: formData,
                });
                if (!res.ok) throw new Error();

                alert("Upload berhasil");
                loadData();
              } catch {
                alert("Upload gagal");
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
      </div>

      {/* FILTER */}
      <div className="flex gap-2 text-xs">
        <input
          className="input-dense w-48"
          placeholder="Search IPD / Description"
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

      {/* TABLE */}
      <div className="bg-white border rounded p-3">
        <table className="w-full border text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">No</th>
              <th className="border px-2 py-1">IPD SIIS</th>
              <th className="border px-2 py-1">Description</th>
              <th className="border px-2 py-1">FB Type</th>
              <th className="border px-2 py-1">Commodity</th>
              <th className="border px-2 py-1">IPD Quotation</th>
              <th className="border px-2 py-1">Action</th>
            </tr>
          </thead>
          <tbody>
            {pagedData.map((r, i) => (
              <tr key={r.id}>
                <td className="border px-2 py-1">
                  {page * PAGE_SIZE + i + 1}
                </td>
                <td className="border px-2 py-1">{r.ipd_siis}</td>
                <td className="border px-2 py-1">{r.description}</td>
                <td className="border px-2 py-1">{r.fb_type}</td>
                <td className="border px-2 py-1">{r.commodity}</td>
                <td className="border px-2 py-1">{r.ipd_quotation}</td>
                <td className="border px-2 py-1 text-center">
                  <button onClick={() => handleEdit(r)}>✏️</button>
                  <button onClick={() => handleDelete(r.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
