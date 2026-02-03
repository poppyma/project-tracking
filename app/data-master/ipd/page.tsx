"use client";

import { useEffect, useState } from "react";

type IPD = {
  id: string;
  ipd_siis: string;
  supplier_id: string; 
  supplier: string;
  desc: string | null;
  fb_type: string;
  commodity: string;
  ipd_quotation: string;
};

type Supplier = {
  id: string;
  supplier_code: string;
  supplier_name: string;
};


const PAGE_SIZE = 50;
const FB_TYPES = ["DGBB", "HBU-1"];
const COMMODITIES = ["Cage", "Ring", "Balls", "Seal", "Shield"];

export default function InputIPDPage() {
  const [data, setData] = useState<IPD[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [uploadingCSV, setUploadingCSV] = useState(false);
  const [savingIPD, setSavingIPD] = useState(false);
  const [deletingIPD, setDeletingIPD] = useState(false);
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterSupplier, setFilterSupplier] = useState("");

  const [search, setSearch] = useState("");
  const [filterFb, setFilterFb] = useState("");
  const [filterCommodity, setFilterCommodity] = useState("");
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [csvSupplier, setCsvSupplier] = useState("");

  const [form, setForm] = useState({
    ipd_siis: "",
    supplier_id: "",
    desc: "",
    fb_type: "",
    commodity: "",
    ipd_quotation: "",
  });

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  function toggleSelectAllCurrentPage() {
    const pageIds = pagedData.map((r) => r.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));

    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !pageIds.includes(id))
        : [...new Set([...prev, ...pageIds])]
    );
  }

    async function handleBulkDelete() {
      if (selectedIds.length === 0) return;

      if (!confirm(`Hapus ${selectedIds.length} data IPD?`)) return;

      setLoading(true);
      try {
        await fetch("/api/ipd/bulk-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedIds }),
        });

        alert("Data berhasil dihapus");
        setSelectedIds([]);
        loadData();
      } catch {
        alert("Gagal menghapus data");
      } finally {
        setLoading(false);
      }
    }

  
  /* LOAD DATA */
 async function loadData() {
  try {
    setLoadingTable(true);
    const res = await fetch("/api/ipd");
    if (!res.ok) throw new Error();
    setData(await res.json());
  } catch {
    alert("Gagal mengambil data IPD");
  } finally {
    setLoadingTable(false);
  }
}


  async function handleUploadCSV(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith(".csv")) {
        alert("File harus berformat CSV");
        return;
      }


      if (!csvSupplier) {
        alert("Pilih supplier terlebih dahulu");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("supplier", csvSupplier); // 🔥 INI KUNCINYA

      setUploadingCSV(true);

      try {
        const res = await fetch("/api/ipd/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error();

        alert("Upload CSV berhasil");
        loadData();
      } catch {
        alert("Gagal upload CSV");
      } finally {
        setUploadingCSV(false);
        e.target.value = "";
      }
    }


  useEffect(() => {
    fetch("/api/supplier")
      .then((r) => r.json())
      .then(setSuppliers);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [search, filterFb, filterCommodity, filterSupplier]);

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
      supplier_id: "",
      desc: "",
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
      supplier_id: row.supplier_id,
      desc: row.desc ?? "",
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
    row.ipd_siis.toLowerCase().includes(s) &&
    (filterFb ? row.fb_type === filterFb : true) &&
    (filterCommodity ? row.commodity === filterCommodity : true) &&
    (filterSupplier ? row.supplier === filterSupplier : true)
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

      <div className="flex gap-2">
        <select
      className="input-dense w-64 pr-10"
      value={csvSupplier}
      onChange={(e) => setCsvSupplier(e.target.value)}
    >
      <option value="">-- Select Supplier --</option>
      {suppliers.map((s) => (
        <option key={s.id} value={s.supplier_name}>
          {s.supplier_code} - {s.supplier_name}
        </option>
      ))}
    </select>

    <label
  className={`px-3 py-1.5 text-xs rounded text-white cursor-pointer
    ${!csvSupplier || uploadingCSV ? "bg-gray-400" : "bg-green-600"}
  `}
>
  {uploadingCSV ? "Uploading..." : "Upload CSV"}

  <input
    type="file"
    accept=".csv"
    onChange={handleUploadCSV}
    disabled={!csvSupplier || uploadingCSV}
    className="hidden"
  />
</label>



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
  </div>
</div>


{selectedIds.length > 0 && (
  <button
    onClick={handleBulkDelete}
    className="px-3 py-1.5 text-xs rounded bg-red-600 text-white"
  >
    Delete Selected ({selectedIds.length})
  </button>
)}



      {/* FILTER */}
      <div className="flex gap-2 text-xs">
        <input
          className="input-dense w-48"
          placeholder="Search IPD"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="input-dense w-64"
          value={filterSupplier}
          onChange={(e) => setFilterSupplier(e.target.value)}
        >
          <option value="">All Supplier</option>

          {suppliers.map((s) => (
            <option key={s.id} value={s.supplier_name}>
              {s.supplier_code} - {s.supplier_name}
            </option>
          ))}
        </select>

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
            value={form.supplier_id}
            onChange={(e) =>
              setForm({ ...form, supplier_id: e.target.value })
            }
          >
            <option value="">-- Select Supplier --</option>

            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.supplier_code} - {s.supplier_name}
              </option>
            ))}
          </select>

          <input
              className="input-dense col-span-2"
              placeholder="Desc"
              value={form.desc}
              onChange={(e) =>
                setForm({ ...form, desc: e.target.value })
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
              <th className="border px-2 py-1 text-center w-14">
                <input
                  type="checkbox"
                  checked={
                    pagedData.length > 0 &&
                    pagedData.every((r) => selectedIds.includes(r.id))
                  }
                  onChange={toggleSelectAllCurrentPage}
                />
              </th>
              <th className="border px-2 py-1 text-center w-10">No</th>
              <th className="border px-2 py-1">IPD SIIS</th>
              <th className="border px-2 py-1">Supplier</th>
              <th className="border px-2 py-1">Desc</th>
              <th className="border px-2 py-1">FB Type</th>
              <th className="border px-2 py-1">Comodity</th>
              <th className="border px-2 py-1">IPD Quotation</th>
              <th className="border px-2 py-1 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
  {loadingTable ? (
    <tr>
      <td colSpan={9} className="text-center py-6 text-gray-500">
        Loading data IPD...
      </td>
    </tr>
  ) : pagedData.length === 0 ? (
    <tr>
      <td colSpan={9} className="text-center py-6 text-gray-400">
        Tidak ada data yang ditemukan
      </td>
    </tr>
  ) : (
    pagedData.map((r, i) => (
      <tr key={r.id}>
        <td className="border px-2 py-1 text-center">
          <input
            type="checkbox"
            checked={selectedIds.includes(r.id)}
            onChange={() => toggleSelect(r.id)}
          />
        </td>

        <td className="border px-2 py-1 text-center">
          {page * PAGE_SIZE + i + 1}
        </td>

        <td className="border px-2 py-1">{r.ipd_siis}</td>
        <td className="border px-2 py-1">{r.supplier}</td>
        <td className="border px-2 py-1">{r.desc || "-"}</td>
        <td className="border px-2 py-1">{r.fb_type}</td>
        <td className="border px-2 py-1">{r.commodity}</td>
        <td className="border px-2 py-1">{r.ipd_quotation}</td>

        <td className="border px-2 py-1">
          <div className="flex justify-center gap-2">
            <button
              title="Edit"
              onClick={() => handleEdit(r)}
              className="p-1 rounded hover:bg-blue-100"
              disabled={loading}
            >
              ✏️
            </button>

            <button
              title="Delete"
              onClick={() => handleDelete(r.id)}
              className="p-1 rounded hover:bg-red-100"
              disabled={loading}
            >
              🗑️
            </button>
          </div>
        </td>
      </tr>
    ))
  )}
</tbody>


        </table>

        {/* PAGINATION */}
        <div className="flex justify-between mt-2 text-xs">
          <span>
            Page {page + 1} of {totalPages || 1}
          </span>
          <div className="space-x-2">
            <button
              disabled={page === 0 || loading}
              onClick={() => setPage(page - 1)}
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages - 1 || loading}
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
