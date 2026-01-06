"use client";

import { useEffect, useState } from "react";

/* ================= TYPES ================= */

type Supplier = {
  id: string;
  supplier_code: string;
  supplier_name: string;
  currency: string;
  incoterm: string;
  top: number;
};

type PriceRow = {
  header_id: string;
  start_date: string;
  end_date: string;
  quarter: string;

  detail_id: string;
  ipd_quotation: string;

  ipd_siis: string | null;
  description: string | null;

  steel_spec: string | null;
  material_source: string | null;
  price: string;
};

/* ================= PAGE ================= */

export default function ViewPricePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [quarters, setQuarters] = useState<string[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState("");
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(false);

  /* ===== EDIT STATE ===== */
  const [editId, setEditId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<Partial<PriceRow>>({});

  const headerInfo = rows.length > 0 ? rows[0] : null;

  /* ================= LOAD SUPPLIER ================= */
  useEffect(() => {
    fetch("/api/supplier")
      .then((r) => r.json())
      .then(setSuppliers);
  }, []);

  /* ================= LOAD QUARTER ================= */
  useEffect(() => {
    if (!selectedSupplier) return;

    fetch(`/api/price?list_quarter=true&supplier_id=${selectedSupplier.id}`)
      .then((r) => r.json())
      .then(setQuarters);
  }, [selectedSupplier]);

  /* ================= FETCH PRICE ================= */
  async function fetchPrice() {
    if (!selectedSupplier) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        supplier_id: selectedSupplier.id,
      });
      if (selectedQuarter) params.append("quarter", selectedQuarter);

      const res = await fetch(`/api/price?${params}`);
      const data = await res.json();
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  /* ================= EDIT ================= */
  function startEdit(row: PriceRow) {
    setEditId(row.detail_id);
    setEditRow({
      ...row,
      price:
        row.price && !isNaN(Number(row.price))
          ? String(row.price)
          : "",
    });
  }


  function cancelEdit() {
    setEditId(null);
    setEditRow({});
  }

  async function saveEdit() {
    if (!editId) return;

    try {
      const res = await fetch(`/api/price/detail/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steel_spec: editRow.steel_spec ?? null,
          material_source: editRow.material_source ?? null,
          price: editRow.price,
        }),
      });

      if (!res.ok) throw new Error();

      alert("Data berhasil diupdate");
      cancelEdit();
      fetchPrice();
    } catch {
      alert("Gagal update data");
    }
  }


  /* ================= DELETE ================= */
  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus data ini?")) return;

    try {
      const res = await fetch(`/api/price/detail/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      alert("Data berhasil dihapus");
      fetchPrice();
    } catch {
      alert("Gagal menghapus data");
    }
  }

  /* ================= UI ================= */
  return (
    <div className="p-4 space-y-4 text-xs">
      <h1 className="text-2xl font-bold">View Price</h1>

      {/* FILTER */}
      <div className="flex gap-2">
        <select
          className="border px-2 py-1"
          value={selectedSupplier?.id || ""}
          onChange={(e) =>
            setSelectedSupplier(
              suppliers.find((s) => s.id === e.target.value) || null
            )
          }
        >
          <option value="">-- Select Supplier --</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.supplier_code} - {s.supplier_name}
            </option>
          ))}
        </select>

        <select
          className="border px-2 py-1"
          value={selectedQuarter}
          onChange={(e) => setSelectedQuarter(e.target.value)}
          disabled={quarters.length === 0}
        >
          <option value="">-- Select Quarter --</option>
          {quarters.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>

        <button
          className="bg-blue-600 text-white px-3 py-1"
          onClick={fetchPrice}
          disabled={!selectedSupplier || loading}
        >
          {loading ? "Loading..." : "View Price"}
        </button>
      </div>

      {/* HEADER INFO */}
      {selectedSupplier && (
        <div className="border rounded bg-gray-50 p-3 grid grid-cols-2 gap-2">
          <div><b>Supplier Code:</b> {selectedSupplier.supplier_code}</div>
          <div><b>Supplier Name:</b> {selectedSupplier.supplier_name}</div>
          <div><b>Currency:</b> {selectedSupplier.currency}</div>
          <div><b>Incoterm:</b> {selectedSupplier.incoterm}</div>
          <div><b>TOP:</b> {selectedSupplier.top} Days</div>
          <div><b>Quarter:</b> {selectedQuarter || "-"}</div>
          <div><b>Start Date:</b> {headerInfo?.start_date || "-"}</div>
          <div><b>End Date:</b> {headerInfo?.end_date || "-"}</div>
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-[1200px] border text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">No</th>
              <th className="border px-2 py-1">IPD</th>
              <th className="border px-2 py-1">Description</th>
              <th className="border px-2 py-1">Steel Spec</th>
              <th className="border px-2 py-1">Steel Supplier</th>
              <th className="border px-2 py-1 text-right">Price</th>
              <th className="border px-2 py-1 w-28">Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="border py-6 text-center text-gray-400">
                  No data
                </td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const isEdit = editId === r.detail_id;

                return (
                  <tr key={r.detail_id}>
                    <td className="border px-2 py-1 text-center">{i + 1}</td>

                    <td className="border px-2 py-1">
                      {isEdit ? (
                        <input
                          className="w-full border px-1"
                          value={editRow.ipd_siis || ""}
                          onChange={(e) =>
                            setEditRow({ ...editRow, ipd_siis: e.target.value })
                          }
                        />
                      ) : (
                        r.ipd_siis || "-"
                      )}
                    </td>

                    <td className="border px-2 py-1">
                      {isEdit ? (
                        <input
                          className="w-full border px-1"
                          value={editRow.description || ""}
                          onChange={(e) =>
                            setEditRow({ ...editRow, description: e.target.value })
                          }
                        />
                      ) : (
                        r.description || "-"
                      )}
                    </td>

                    <td className="border px-2 py-1">
                      {isEdit ? (
                        <input
                          className="w-full border px-1"
                          value={editRow.steel_spec || ""}
                          onChange={(e) =>
                            setEditRow({ ...editRow, steel_spec: e.target.value })
                          }
                        />
                      ) : (
                        r.steel_spec || "-"
                      )}
                    </td>

                    <td className="border px-2 py-1">
                      {isEdit ? (
                        <input
                          className="w-full border px-1"
                          value={editRow.material_source || ""}
                          onChange={(e) =>
                            setEditRow({
                              ...editRow,
                              material_source: e.target.value,
                            })
                          }
                        />
                      ) : (
                        r.material_source || "-"
                      )}
                    </td>

                    <td className="border px-2 py-1 text-right">
                      {isEdit ? (
                        <input
                          type="number"
                          className="w-full border px-1 text-right"
                          value={editRow.price || ""}
                          onChange={(e) =>
                            setEditRow({ ...editRow, price: e.target.value })
                          }
                        />
                      ) : (
                        r.price
                      )}
                    </td>

                    <td className="border px-2 py-1 text-center">
                      {isEdit ? (
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={saveEdit}
                            className="px-2 py-0.5 bg-green-600 text-white rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-2 py-0.5 bg-gray-400 text-white rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => startEdit(r)}
                            className="px-2 py-0.5 bg-yellow-500 text-white rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(r.detail_id)}
                            className="px-2 py-0.5 bg-red-600 text-white rounded"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
