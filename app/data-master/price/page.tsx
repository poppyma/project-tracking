"use client";

import { useEffect, useState } from "react";

function getQuarter(date: string) {
  const m = new Date(date).getMonth() + 1;
  return `Q${Math.ceil(m / 3)}-${new Date(date).getFullYear()}`;
}

export default function ViewPricePage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [header, setHeader] = useState<any>(null);

  useEffect(() => {
    fetch("/api/supplier")
      .then(res => res.json())
      .then(setSuppliers);
  }, []);

  useEffect(() => {
    if (!supplierId) return;

    fetch(`/api/price/view?supplier_id=${supplierId}`)
      .then(res => res.json())
      .then(data => {
        setRows(data);
        setHeader(data[0]);
      });
  }, [supplierId]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">View Price</h1>

      {/* Supplier selector */}
      <select
        className="border p-2 w-full max-w-md"
        onChange={e => setSupplierId(e.target.value)}
      >
        <option value="">Select Supplier</option>
        {suppliers.map(s => (
          <option key={s.id} value={s.id}>
            {s.supplier_code} - {s.supplier_name}
          </option>
        ))}
      </select>

      {/* HEADER INFO */}
      {header && (
        <div className="grid grid-cols-2 gap-2 text-sm border p-4 bg-gray-50">
          <div><b>Supplier Code</b> : {header.supplier_code}</div>
          <div><b>Supplier Name</b> : {header.supplier_name}</div>
          <div><b>Currency</b> : {header.currency}</div>
          <div><b>Incoterm</b> : {header.incoterm}</div>
          <div><b>Term of Payment</b> : {header.top}</div>
          <div><b>Start Date</b> : {header.start_date}</div>
          <div><b>End Date</b> : {header.end_date}</div>
          <div><b>Quarter</b> : {getQuarter(header.start_date)}</div>
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
                <td className="border px-2 text-center">{i + 1}</td>
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
