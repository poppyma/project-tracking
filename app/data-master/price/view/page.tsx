"use client";

import { useEffect, useState } from "react";

type Supplier = {
  id: string;
  supplier_code: string;
  supplier_name: string;
  currency: string;
  incoterm: string;
  top: number;
};

type PriceRow = {
  detail_id: string;
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

export default function PricePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");
  const [rows, setRows] = useState<PriceRow[]>([]);

  const [quarters, setQuarters] = useState<string[]>([]);

  // Load suppliers
  useEffect(() => {
    fetch("/api/supplier")
      .then(r => r.json())
      .then(setSuppliers);
  }, []);

  // Load quarter list (hardcode atau dari API)
  useEffect(() => {
    setQuarters(["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]);
  }, []);

  async function loadPrice() {
    if (!selectedSupplier || !selectedQuarter) return;

    try {
      const res = await fetch(
        `/api/price?supplier_id=${selectedSupplier}&quarter=${encodeURIComponent(selectedQuarter)}`
      );
      const json = await res.json();
      setRows(json);
    } catch (err) {
      console.error("LOAD PRICE ERROR:", err);
      setRows([]);
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "";
    return dateStr.split("T")[0];
  }

  return (
    <div className="p-4 space-y-4 text-xs">
      <h1 className="text-2xl font-bold mb-4">View Price</h1>

      <div className="flex gap-2">
        {/* Supplier Dropdown */}
        <select
          value={selectedSupplier}
          onChange={e => setSelectedSupplier(e.target.value)}
          className="border px-2 py-1"
        >
          <option value="">-- Select Supplier --</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>
              {s.supplier_code} - {s.supplier_name}
            </option>
          ))}
        </select>

        {/* Quarter Dropdown */}
        <select
          value={selectedQuarter}
          onChange={e => setSelectedQuarter(e.target.value)}
          className="border px-2 py-1"
        >
          <option value="">-- Select Quarter --</option>
          {quarters.map(q => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>

        <button
          onClick={loadPrice}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          View Price
        </button>
      </div>

      {/* Table */}
      <table className="w-full border text-xs mt-2">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">IPD SIIS</th>
            <th className="border px-2 py-1">Description</th>
            <th className="border px-2 py-1">Steel Spec</th>
            <th className="border px-2 py-1">Material Source</th>
            <th className="border px-2 py-1">Tube Route</th>
            <th className="border px-2 py-1">Price</th>
            <th className="border px-2 py-1">Start Date</th>
            <th className="border px-2 py-1">End Date</th>
            <th className="border px-2 py-1">Quarter</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center py-3 text-gray-400">
                No data
              </td>
            </tr>
          ) : (
            rows.map(r => (
              <tr key={r.detail_id}>
                <td className="border px-2 py-1">{r.ipd_siis}</td>
                <td className="border px-2 py-1">{r.description}</td>
                <td className="border px-2 py-1">{r.steel_spec}</td>
                <td className="border px-2 py-1">{r.material_source}</td>
                <td className="border px-2 py-1">{r.tube_route}</td>
                <td className="border px-2 py-1">{r.price}</td>
                <td className="border px-2 py-1">{formatDate(r.start_date)}</td>
                <td className="border px-2 py-1">{formatDate(r.end_date)}</td>
                <td className="border px-2 py-1">{r.quarter}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
