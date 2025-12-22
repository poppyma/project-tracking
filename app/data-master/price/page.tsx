"use client";

import { useEffect, useState } from "react";

export default function PriceInputPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const [form, setForm] = useState({
    supplier_id: "",
    start_date: "",
    end_date: "",
    ipd_quotation: "",
    ipd_siis: "",
    description: "",
    steel_spec: "",
    material_source: "",
    tube_route: "",
    price: "",
  });

  useEffect(() => {
    fetch("/api/supplier")
      .then((res) => res.json())
      .then(setSuppliers);
  }, []);

  const save = async () => {
    const res = await fetch("/api/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
      }),
    });

    if (!res.ok) {
      alert("Gagal simpan data");
      return;
    }

    alert("Data berhasil disimpan");
  };

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Input Price</h1>

      {/* Supplier */}
      <select
        className="border p-2 w-full"
        value={form.supplier_id}
        onChange={(e) => {
          const sup = suppliers.find(s => s.id === e.target.value);
          setSelectedSupplier(sup);
          setForm({ ...form, supplier_id: e.target.value });
        }}
      >
        <option value="">Pilih Supplier</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.supplier_name} ({s.supplier_code})
          </option>
        ))}
      </select>

      {/* Supplier Detail */}
      {selectedSupplier && (
        <div className="border rounded p-3 bg-gray-50 text-sm space-y-1">
          <div><b>Country:</b> {selectedSupplier.country}</div>
          <div><b>Currency:</b> {selectedSupplier.currency}</div>
          <div><b>Incoterm:</b> {selectedSupplier.incoterm}</div>
          <div><b>TOP:</b> {selectedSupplier.top}</div>
        </div>
      )}

      {/* Date (UI bawah supplier, tapi tetap disimpan) */}
      <div className="grid grid-cols-2 gap-3">
        <input type="date" className="border p-2"
          onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        <input type="date" className="border p-2"
          onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
      </div>

      <input className="border p-2 w-full" placeholder="IPD Quotation"
        onChange={(e) => setForm({ ...form, ipd_quotation: e.target.value })} />

      <input className="border p-2 w-full" placeholder="IPD SIIS"
        onChange={(e) => setForm({ ...form, ipd_siis: e.target.value })} />

      <textarea className="border p-2 w-full" placeholder="Description"
        onChange={(e) => setForm({ ...form, description: e.target.value })} />

      <input className="border p-2 w-full" placeholder="Steel Spec"
        onChange={(e) => setForm({ ...form, steel_spec: e.target.value })} />

      <input className="border p-2 w-full" placeholder="Material Source"
        onChange={(e) => setForm({ ...form, material_source: e.target.value })} />

      <input className="border p-2 w-full" placeholder="Tube Route"
        onChange={(e) => setForm({ ...form, tube_route: e.target.value })} />

      <input type="number" className="border p-2 w-full" placeholder="Price"
        onChange={(e) => setForm({ ...form, price: e.target.value })} />

      <button onClick={save} className="bg-black text-white px-4 py-2 rounded">
        Save
      </button>
    </div>
  );
}
