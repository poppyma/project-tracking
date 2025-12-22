"use client";

import { useEffect, useState } from "react";

type IPD = {
  id: string;
  ipd_siis: string;
  description: string;
  steel_spec: string;
  material_source: string;
  tube_route: string;
};

type Supplier = {
  id: string;
  supplier_name: string;
  currency: string;
  incoterm: string;
  top: number | null;
};

export default function InputPricePage() {
  const [ipds, setIpds] = useState<IPD[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    ipd_id: "",
    supplier_id: "",
    start_date: "",
    end_date: "",
    quarter: "",
    year: new Date().getFullYear(),
    price: "",
  });

  /* ===== Load Master Data ===== */
  useEffect(() => {
    fetch("/api/ipd-master").then(r => r.json()).then(setIpds);
    fetch("/api/supplier-master").then(r => r.json()).then(setSuppliers);
  }, []);

  /* ===== Auto Quarter ===== */
  function calcQuarter(date: string) {
    const m = new Date(date).getMonth() + 1;
    return m <= 3 ? "Q1" : m <= 6 ? "Q2" : m <= 9 ? "Q3" : "Q4";
  }

  async function handleSubmit() {
    if (!form.ipd_id || !form.supplier_id || !form.start_date || !form.price) {
      alert("Field wajib belum lengkap");
      return;
    }

    setLoading(true);
    await fetch("/api/price-input", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quarter: calcQuarter(form.start_date),
      }),
    });

    setLoading(false);
    alert("Price berhasil disimpan");
  }

  const selectedIPD = ipds.find(i => i.id === form.ipd_id);
  const selectedSupplier = suppliers.find(s => s.id === form.supplier_id);

  return (
    <div className="space-y-3 text-xs">

      <h1 className="font-semibold">Input Price</h1>

      {/* IPD */}
      <select
        className="input-dense"
        value={form.ipd_id}
        onChange={(e) =>
          setForm({ ...form, ipd_id: e.target.value })
        }
      >
        <option value="">-- Select IPD --</option>
        {ipds.map(i => (
          <option key={i.id} value={i.id}>
            {i.ipd_siis}
          </option>
        ))}
      </select>

      {selectedIPD && (
        <div className="border p-2 bg-gray-50">
          <div>Description: {selectedIPD.description}</div>
          <div>Steel Spec: {selectedIPD.steel_spec}</div>
          <div>Material: {selectedIPD.material_source}</div>
          <div>Tube Route: {selectedIPD.tube_route}</div>
        </div>
      )}

      {/* Supplier */}
      <select
        className="input-dense"
        value={form.supplier_id}
        onChange={(e) =>
          setForm({ ...form, supplier_id: e.target.value })
        }
      >
        <option value="">-- Select Supplier --</option>
        {suppliers.map(s => (
          <option key={s.id} value={s.id}>
            {s.supplier_name}
          </option>
        ))}
      </select>

      {selectedSupplier && (
        <div className="border p-2 bg-gray-50">
          <div>Currency: {selectedSupplier.currency}</div>
          <div>Incoterm: {selectedSupplier.incoterm}</div>
          <div>TOP: {selectedSupplier.top}</div>
        </div>
      )}

      {/* Dates & Price */}
      <input type="date" className="input-dense" value={form.start_date}
        onChange={e => setForm({ ...form, start_date: e.target.value })} />

      <input type="date" className="input-dense" value={form.end_date}
        onChange={e => setForm({ ...form, end_date: e.target.value })} />

      <input
        className="input-dense"
        placeholder="Price"
        value={form.price}
        onChange={(e) => setForm({ ...form, price: e.target.value })}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-4 py-1 bg-blue-600 text-white rounded"
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
