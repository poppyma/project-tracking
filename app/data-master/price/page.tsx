"use client";

import { useEffect, useState } from "react";

/* =========================
   TYPES
========================= */
type Supplier = {
  id: string;
  supplier_code: string;
  supplier_name: string;
  currency: string;
  incoterm: string;
  top: number;
};

type PriceRow = {
  id: string;
  ipd_quotation: string;
  ipd_siis: string;
  description: string;
  steel_spec: string;
  material_source: string;
  tube_route: string;
  price: string;
  start_date: string;
  end_date: string;
  quarter: string;
};

/* =========================
   UTILS
========================= */
export default function PricePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    ipd_quotation: "",
    ipd_siis: "",
    description: "",
    steel_spec: "",
    material_source: "",
    tube_route: "",
    price: "",
    start_date: "",
    end_date: "",
  });

  const [rows, setRows] = useState<PriceRow[]>([]);
  const [showForm, setShowForm] = useState(false);

  /* =========================
     LOAD SUPPLIER
  ========================= */
  useEffect(() => {
    fetch("/api/supplier")
      .then((r) => r.json())
      .then(setSuppliers);
  }, []);

  /* =========================
     LOAD PRICE
  ========================= */
  async function loadPrice(supplierId: string) {
    try {
      const res = await fetch(`/api/price?supplier_id=${supplierId}`);
      const json = await res.json();

      if (!Array.isArray(json)) {
        console.error("PRICE API ERROR:", json);
        setRows([]);
        return;
      }

      setRows(json);
    } catch (err) {
      console.error("LOAD PRICE ERROR:", err);
      setRows([]);
    }
  }

  function getQuarterLabel(dateStr: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const month = date.getMonth();
    const year = date.getFullYear();
    const quarter = Math.floor(month / 3) + 1;
    return `Q${quarter} ${year}`;
  }

  /* =========================
     SAVE
  ========================= */
  async function handleSave() {
    if (!selectedSupplier || !form.start_date || !form.price) {
      alert("Supplier, Start Date & Price wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: selectedSupplier.id,
          start_date: form.start_date,
          end_date: form.end_date || null,
          ipd_quotation: form.ipd_quotation || null,
          ipd_siis: form.ipd_siis || null,
          description: form.description || null,
          steel_spec: form.steel_spec || null,
          material_source: form.material_source || null,
          tube_route: form.tube_route || null,
          price: Number(form.price),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Gagal simpan data");
        return;
      }

      alert("Data berhasil disimpan!");
      setForm({
        ipd_quotation: "",
        ipd_siis: "",
        description: "",
        steel_spec: "",
        material_source: "",
        tube_route: "",
        price: "",
        start_date: "",
        end_date: "",
      });
      setShowForm(false);
      if (selectedSupplier) await loadPrice(selectedSupplier.id);
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 text-xs p-4">
      {/* Judul Halaman */}
      <h1 className="text-2xl font-bold mb-4">View Price</h1>

      {/* SUPPLIER SELECT */}
      <select
        className="border px-2 py-1"
        onChange={(e) => {
          const s = suppliers.find((x) => x.id === e.target.value);
          setSelectedSupplier(s || null);
          if (s) loadPrice(s.id);
        }}
      >
        <option value="">-- Select Supplier --</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.supplier_code} - {s.supplier_name}
          </option>
        ))}
      </select>

      {/* SUPPLIER DETAIL */}
      {selectedSupplier && (
        <div className="border p-2 bg-gray-50 space-y-1">
          <div>Supplier Code: {selectedSupplier.supplier_code}</div>
          <div>Supplier Name: {selectedSupplier.supplier_name}</div>
          <div>Currency: {selectedSupplier.currency}</div>
          <div>Incoterm: {selectedSupplier.incoterm}</div>
          <div>TOP: {selectedSupplier.top}</div>
        </div>
      )}

      {/* ADD BUTTON */}
      {selectedSupplier && (
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          + Add Price
        </button>
      )}

      {/* FORM */}
      {showForm && (
        <div className="grid grid-cols-4 gap-2 border p-3">
          {Object.entries(form)
            .filter(([k]) => k !== "start_date" && k !== "end_date")
            .map(([k, v]) => (
              <input
                key={k}
                placeholder={k.replace("_", " ").toUpperCase()}
                value={v}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                className="border px-2 py-1"
              />
            ))}

          {/* Start & End Date */}
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            className="border px-2 py-1 text-xs h-7"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            className="border px-2 py-1 text-xs h-7"
            placeholder="End Date"
          />

          <div className="col-span-4 flex justify-end gap-2 mt-2">
            <button onClick={() => setShowForm(false)}>Cancel</button>
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-1"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* DISPLAY START/END DATE & QUARTER */}
      {rows.length > 0 && (
        <div className="border p-2 bg-gray-50 mt-2 text-sm space-y-1">
          {rows.map((r) => (
            <div key={r.id} className="flex gap-4">
              <div>Start Date: {r.start_date}</div>
              <div>End Date: {r.end_date}</div>
              <div>Quarter: {getQuarterLabel(r.end_date)}</div>
            </div>
          ))}
        </div>
      )}

      {/* TABLE VIEW PRICE */}
      <table className="w-full border text-xs">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">IPD SIIS</th>
            <th className="border px-2 py-1">Description</th>
            <th className="border px-2 py-1">Steel Spec</th>
            <th className="border px-2 py-1">Material Source</th>
            <th className="border px-2 py-1">Tube Route</th>
            <th className="border px-2 py-1">Price</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-3 text-gray-400">
                No data
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id}>
                <td className="border px-2 py-1">{r.ipd_siis}</td>
                <td className="border px-2 py-1">{r.description}</td>
                <td className="border px-2 py-1">{r.steel_spec}</td>
                <td className="border px-2 py-1">{r.material_source}</td>
                <td className="border px-2 py-1">{r.tube_route}</td>
                <td className="border px-2 py-1">{r.price}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
