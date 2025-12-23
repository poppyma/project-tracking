"use client";

import { useEffect, useState } from "react";

/* ================= TYPES ================= */
type Supplier = {
  id: string;
  supplier_code: string;
  supplier_name: string;
  address: string;
  currency: string;
  incoterm: string;
  top: number;
};

type Row = {
  ipd: string;
  description: string;
  material_source: string;
  quarter: string;
  price: string; // ⬅️ STRING dari DB
};

/* ================= FIXED QUARTERS ================= */
const QUARTERS = ["Q4-2025", "Q1-2026", "Q2-2025", "Q3-2025"];

export default function ViewPriceQuartersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  /* LOAD SUPPLIER */
  useEffect(() => {
    fetch("/api/supplier")
      .then((r) => r.json())
      .then(setSuppliers);
  }, []);

  async function loadData(supplierId: string) {
    const res = await fetch(
      `/api/price-quarters?supplier_id=${supplierId}`
    );
    const json = await res.json();
    setRows(Array.isArray(json) ? json : []);
  }

  /* GROUP IPD */
  const ipds = Array.from(
    new Map(
      rows.map((r) => [
        r.ipd,
        {
          ipd: r.ipd,
          description: r.description,
          material_source: r.material_source,
        },
      ])
    ).values()
  );

  function getPrice(ipd: string, quarter: string) {
    const found = rows.find(
      (r) => r.ipd === ipd && r.quarter === quarter
    );
    return found ? Number(found.price) : 0;
  }

  function diff(curr: number, prev: number) {
    if (prev === 0) return "0%";
    return (((curr - prev) / prev) * 100).toFixed(2) + "%";
  }

  return (
    <div className="p-4 text-xs space-y-4">
      <h1 className="text-2xl font-bold">
        View Update Price Quarters
      </h1>

      {/* SELECT SUPPLIER */}
      <select
        className="border px-2 py-1"
        onChange={(e) => {
          const s = suppliers.find(
            (x) => x.id === e.target.value
          );
          setSupplier(s || null);
          if (s) loadData(s.id);
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
      {supplier && (
        <div className="border p-2 bg-gray-50 space-y-1">
          <div>SUPPLIER: {supplier.supplier_name}</div>
          <div>ADDRESS: {supplier.address}</div>
          <div>CURRENCY: {supplier.currency}</div>
          <div>INCOTERMS: {supplier.incoterm}</div>
          <div>TERMS OF PAYMENT: {supplier.top}</div>
        </div>
      )}

      {/* TABLE */}
      {supplier && (
        <table className="w-full border mt-4">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2">No</th>
              <th className="border px-2">IPD</th>
              <th className="border px-2">DESC</th>
              <th className="border px-2">
                Material Source
              </th>
              {QUARTERS.map((q) => (
                <th key={q} className="border px-2">
                  {q}
                </th>
              ))}
              <th className="border px-2">
                Diff Q1-2026 - Q4-2025
              </th>
              <th className="border px-2">
                Diff Q2-2025 - Q1-2026
              </th>
              <th className="border px-2">
                Diff Q3-2025 - Q2-2025
              </th>
            </tr>
          </thead>

          <tbody>
            {ipds.map((i, idx) => {
              const q4 = getPrice(i.ipd, "Q4-2025");
              const q1 = getPrice(i.ipd, "Q1-2026");
              const q2 = getPrice(i.ipd, "Q2-2025");
              const q3 = getPrice(i.ipd, "Q3-2025");

              return (
                <tr key={i.ipd}>
                  <td className="border px-2 text-center">
                    {idx + 1}
                  </td>
                  <td className="border px-2">{i.ipd}</td>
                  <td className="border px-2">
                    {i.description}
                  </td>
                  <td className="border px-2">
                    {i.material_source}
                  </td>

                  <td className="border px-2">
                    {q4.toFixed(4)}
                  </td>
                  <td className="border px-2">
                    {q1.toFixed(4)}
                  </td>
                  <td className="border px-2">
                    {q2.toFixed(4)}
                  </td>
                  <td className="border px-2">
                    {q3.toFixed(4)}
                  </td>

                  <td className="border px-2">
                    {diff(q1, q4)}
                  </td>
                  <td className="border px-2">
                    {diff(q2, q1)}
                  </td>
                  <td className="border px-2">
                    {diff(q3, q2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
