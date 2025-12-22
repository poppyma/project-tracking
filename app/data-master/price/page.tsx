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
  quarter: string;
  year: number;
};

/* =========================
   UTILS
========================= */
function getQuarter(date: string) {
  const m = new Date(date).getMonth() + 1;
  if (m <= 3) return "Q1";
  if (m <= 6) return "Q2";
  if (m <= 9) return "Q3";
  return "Q4";
}

export default function PricePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [form, setForm] = useState({
    ipd_quotation: "",
    ipd_siis: "",
    description: "",
    steel_spec: "",
    material_source: "",
    tube_route: "",
    price: "",
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
    const res = await fetch(`/api/price?supplier_id=${supplierId}`);
    const json = await res.json();
    setRows(json);
  }

  /* =========================
     SAVE
  ========================= */
  async function handleSave() {
    if (!selectedSupplier || !startDate || !form.price) {
      alert("Supplier, Start Date & Price wajib diisi");
      return;
    }

    const quarter = getQuarter(startDate);
    const year = new Date(startDate).getFullYear();

    await fetch("/api/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplier_id: selectedSupplier.id,
        start_date: startDate,
        end_date: endDate,
        quarter: `${quarter}-${year}`,
        year,
        ...form,
        price: Number(form.price),
      }),
    });

    setForm({
      ipd_quotation: "",
      ipd_siis: "",
      description: "",
      steel_spec: "",
      material_source: "",
      tube_route: "",
      price: "",
    });

    setShowForm(false);
    loadPrice(selectedSupplier.id);
  }

  return (
    <div className="space-y-4 text-xs">

      {/* SUPPLIER SELECT */}
      <select
        className="border px-2 py-1"
        onChange={(e) => {
          const s = suppliers.find(x => x.id === e.target.value);
          setSelectedSupplier(s || null);
          if (s) loadPrice(s.id);
        }}
      >
        <option value="">-- Select Supplier --</option>
        {suppliers.map(s => (
          <option key={s.id} value={s.id}>
            {s.supplier_code} - {s.supplier_name}
          </option>
        ))}
      </select>

      {/* SUPPLIER DETAIL */}
      {selectedSupplier && (
        <div className="border p-2 bg-gray-50">
          <div>Currency: {selectedSupplier.currency}</div>
          <div>Incoterm: {selectedSupplier.incoterm}</div>
          <div>TOP: {selectedSupplier.top}</div>

          <div className="mt-2 flex gap-2">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
      )}

      {/* ADD BUTTON */}
      {selectedSupplier && (
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          + Add Price
        </button>
      )}

      {/* FORM */}
      {showForm && (
        <div className="grid grid-cols-4 gap-2 border p-3">
          {Object.entries(form).map(([k, v]) => (
            <input
              key={k}
              placeholder={k.replace("_", " ").toUpperCase()}
              value={v}
              onChange={e => setForm({ ...form, [k]: e.target.value })}
              className="border px-2 py-1"
            />
          ))}

          <div className="col-span-4 flex justify-end gap-2">
            <button onClick={() => setShowForm(false)}>Cancel</button>
            <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-1">
              Save
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      {rows.length > 0 && (
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th>Quarter</th>
              <th>IPD SIIS</th>
              <th>Description</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.quarter}</td>
                <td>{r.ipd_siis}</td>
                <td>{r.description}</td>
                <td>{r.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
