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
  price: string; // STRING dari DB
};

/* ================= MONTHS ================= */
const MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

/* ================= QUARTER → MONTH MAP ================= */
const QUARTER_MONTH_MAP: Record<string, number[]> = {
  "Q1": [0, 1, 2],
  "Q2": [3, 4, 5],
  "Q3": [6, 7, 8],
  "Q4": [9, 10, 11],
};

export default function ViewSIISPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  /* LOAD SUPPLIERS */
  useEffect(() => {
    fetch("/api/supplier")
      .then((r) => r.json())
      .then(setSuppliers);
  }, []);

  async function loadData(supplierId: string) {
    const res = await fetch(`/api/siis?supplier_id=${supplierId}`);
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

  /* GET MONTH PRICE */
  function getMonthPrice(ipd: string, monthIndex: number) {
    for (const r of rows) {
      const q = r.quarter.split("-")[0]; // Q1, Q2, Q3, Q4
      const months = QUARTER_MONTH_MAP[q];
      if (!months) continue;

      if (months.includes(monthIndex) && r.ipd === ipd) {
        return Number(r.price);
      }
    }
    return 0;
  }

  return (
    <div className="p-4 text-xs space-y-4">
      <h1 className="text-2xl font-bold">
        View Update Price SIIS
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
        <div className="overflow-x-auto">
          <table className="border w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-2">No</th>
                <th className="border px-2">IPD</th>
                <th className="border px-2">DESC</th>
                <th className="border px-2">
                  Material Source
                </th>
                {MONTHS.map((m) => (
                  <th key={m} className="border px-2">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {ipds.map((i, idx) => (
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

                  {MONTHS.map((_, mIdx) => (
                    <td
                      key={mIdx}
                      className="border px-2 text-right"
                    >
                      {getMonthPrice(i.ipd, mIdx).toFixed(4)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
