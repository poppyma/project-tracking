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

  ipd_quotation: string;
  ipd_siis: string;
  description: string;
  steel_spec: string;
  material_source: string;
  tube_route: string;
  price: number;
};

/* ================= PAGE ================= */

export default function ViewPricePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(false);

  /* ================= LOAD SUPPLIER ================= */

  useEffect(() => {
    fetch("/api/supplier")
      .then((r) => r.json())
      .then(setSuppliers);
  }, []);

  /* ================= LOAD PRICE ================= */

  async function loadPrice(supplierId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/price?supplier_id=${supplierId}`);
      const json = await res.json();
      setRows(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  /* ================= GROUP BY HEADER ================= */

  const grouped = rows.reduce<Record<string, PriceRow[]>>((acc, row) => {
    acc[row.header_id] = acc[row.header_id] || [];
    acc[row.header_id].push(row);
    return acc;
  }, {});

  /* ================= UI ================= */

  return (
    <div className="p-4 space-y-4 text-xs">
      <h1 className="text-2xl font-bold">View Price</h1>

      {/* SUPPLIER SELECT */}
      <select
        className="border px-2 py-1"
        onChange={(e) => {
          const s =
            suppliers.find((x) => x.id === e.target.value) || null;
          setSelectedSupplier(s);
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

      {/* SUPPLIER INFO */}
      {selectedSupplier && (
        <div className="border p-2 bg-gray-50">
          <div>Supplier Code : {selectedSupplier.supplier_code}</div>
          <div>Supplier Name : {selectedSupplier.supplier_name}</div>
          <div>Currency : {selectedSupplier.currency}</div>
          <div>Incoterm : {selectedSupplier.incoterm}</div>
          <div>TOP : {selectedSupplier.top}</div>
        </div>
      )}

      {/* CONTENT */}
      {loading && <div>Loading...</div>}

      {!loading && Object.keys(grouped).length === 0 && (
        <div className="text-gray-400">No data</div>
      )}

      {/* ===== PER QUARTER ===== */}
      {Object.values(grouped).map((items) => {
        const header = items[0];

        return (
          <div
            key={header.header_id}
            className="border rounded bg-white"
          >
            {/* HEADER QUARTER */}
            <div className="bg-gray-100 p-2 font-bold flex gap-6">
              <div>Quarter: {header.quarter}</div>
              <div>Start: {header.start_date}</div>
              <div>End: {header.end_date}</div>
            </div>

            {/* TABLE DETAIL */}
            <table className="w-full border-t">
              <thead className="bg-yellow-200">
                <tr>
                  <th className="border px-2 py-1">IPD Quotation</th>
                  <th className="border px-2 py-1">IPD SIIS</th>
                  <th className="border px-2 py-1">Description</th>
                  <th className="border px-2 py-1">Steel Spec</th>
                  <th className="border px-2 py-1">Material Source</th>
                  <th className="border px-2 py-1">Tube Route</th>
                  <th className="border px-2 py-1">Price</th>
                </tr>
              </thead>

              <tbody>
                {items.map((r) => (
                  <tr key={r.ipd_siis}>
                    <td className="border px-2 py-1">
                      {r.ipd_quotation}
                    </td>
                    <td className="border px-2 py-1">{r.ipd_siis}</td>
                    <td className="border px-2 py-1">
                      {r.description}
                    </td>
                    <td className="border px-2 py-1">
                      {r.steel_spec}
                    </td>
                    <td className="border px-2 py-1">
                      {r.material_source}
                    </td>
                    <td className="border px-2 py-1">
                      {r.tube_route}
                    </td>
                    <td className="border px-2 py-1 text-right">
                      {r.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
