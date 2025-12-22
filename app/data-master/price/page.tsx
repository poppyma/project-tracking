"use client";

import { useEffect, useState } from "react";

function getQuarter(date: string) {
  const d = new Date(date);
  return `Q${Math.ceil((d.getMonth() + 1) / 3)}-${d.getFullYear()}`;
}

export default function PricePage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplier, setSupplier] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);

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

  // load supplier
  useEffect(() => {
    fetch("/api/supplier")
      .then(res => res.json())
      .then(setSuppliers);
  }, []);

  // load table data
  const loadTable = async (supplier_id: string) => {
    const res = await fetch(`/api/price/view?supplier_id=${supplier_id}`);
    const data = await res.json();
    setRows(data);
  };

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
    loadTable(form.supplier_id);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Input & View Price</h1>

      {/* SUPPLIER SELECT */}
      <select
        className="border p-2 w-full max-w-lg"
        onChange={(e) => {
          const s = suppliers.find(x => x.id === e.target.value);
          setSupplier(s);
          setForm({ ...form, supplier_id: s.id });
          loadTable(s.id);
        }}
      >
        <option value="">Select Supplier</option>
        {suppliers.map(s => (
          <option key={s.id} value={s.id}>
            {s.supplier_code} - {s.supplier_name}
          </option>
        ))}
      </select>

      {/* SUPPLIER INFO */}
      {supplier && (
        <div className="grid grid-cols-2 gap-2 text-sm border p-4 bg-gray-50">
          <div><b>Supplier Code</b> : {supplier.supplier_code}</div>
          <div><b>Supplier Name</b> : {supplier.supplier_name}</div>
          <div><b>Currency</b> : {supplier.currency}</div>
          <div><b>Incoterm</b> : {supplier.incoterm}</div>
          <div><b>Term of Payment</b> : {supplier.top}</div>

          <div>
            <b>Start Date</b> :
            <input
              type="date"
              className="border ml-2"
              onChange={(e) =>
                setForm({ ...form, start_date: e.target.value })
              }
            />
          </div>

          <div>
            <b>End Date</b> :
            <input
              type="date"
              className="border ml-2"
              onChange={(e) =>
                setForm({ ...form, end_date: e.target.value })
              }
            />
          </div>

          {form.start_date && (
            <div><b>Quarter</b> : {getQuarter(form.start_date)}</div>
          )}
        </div>
      )}

      {/* INPUT PRICE */}
      {supplier && (
        <div className="grid grid-cols-2 gap-3 border p-4">
          <input className="border p-2" placeholder="IPD Quotation"
            onChange={e => setForm({ ...form, ipd_quotation: e.target.value })} />

          <input className="border p-2" placeholder="IPD SIIS"
            onChange={e => setForm({ ...form, ipd_siis: e.target.value })} />

          <input className="border p-2 col-span-2" placeholder="Description"
            onChange={e => setForm({ ...form, description: e.target.value })} />

          <input className="border p-2" placeholder="Steel Spec"
            onChange={e => setForm({ ...form, steel_spec: e.target.value })} />

          <input className="border p-2" placeholder="Material Source"
            onChange={e => setForm({ ...form, material_source: e.target.value })} />

          <input className="border p-2" placeholder="Tube Route"
            onChange={e => setForm({ ...form, tube_route: e.target.value })} />

          <input className="border p-2" type="number" placeholder="Price"
            onChange={e => setForm({ ...form, price: e.target.value })} />

          <button
            onClick={save}
            className="bg-black text-white px-4 py-2 rounded col-span-2"
          >
            Save
          </button>
        </div>
      )}

      {/* TABLE */}
      {rows.length > 0 && (
        <table className="w-full border text-sm">
          <thead className="bg-gray-300">
            <tr>
              <th className="border px-2">No</th>
              <th className="border px-2">IPD</th>
              <th className="border px-2">Description</th>
              <th className="border px-2">Steel Spec</th>
              <th className="border px-2">Material Source</th>
              <th className="border px-2">Tube Route</th>
              <th className="border px-2">Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="border px-2">{i + 1}</td>
                <td className="border px-2">{r.ipd_siis}</td>
                <td className="border px-2">{r.description}</td>
                <td className="border px-2">{r.steel_spec}</td>
                <td className="border px-2">{r.material_source}</td>
                <td className="border px-2">{r.tube_route}</td>
                <td className="border px-2 text-right">{r.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
