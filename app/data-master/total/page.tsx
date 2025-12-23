"use client";

import { useEffect, useState } from "react";

type Row = {
  supplier_code: string;
  supplier_name: string;
  quarter: string;
  total_ipd: string;
};

const QUARTERS = [
  "Q4-2025",
  "Q1-2026",
  "Q2-2026",
  "Q3-2026",
];

export default function ViewTotalIPDPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch("/api/total")
      .then((r) => r.json())
      .then(setRows);
  }, []);

  // ambil supplier unik
  const suppliers = Array.from(
    new Map(
      rows.map((r) => [
        r.supplier_code,
        { supplier_code: r.supplier_code, supplier_name: r.supplier_name },
      ])
    ).values()
  );

  function getValue(code: string, quarter: string) {
    const found = rows.find(
      (r) =>
        r.supplier_code === code &&
        r.quarter === quarter
    );
    return found ? found.total_ipd : "0";
  }

  return (
    <div className="p-4 text-xs">
      <h1 className="text-2xl font-bold mb-4">
        View Total Update IPD Price Summary by Supplier
      </h1>

      <table className="w-full border">
        <thead className="bg-gray-200">
          <tr>
            <th className="border px-2 py-1">No</th>
            <th className="border px-2 py-1">Supplier Code</th>
            <th className="border px-2 py-1">Supplier Name</th>
            {QUARTERS.map((q) => (
              <th key={q} className="border px-2 py-1">
                {q}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {suppliers.length === 0 ? (
            <tr>
              <td
                colSpan={3 + QUARTERS.length}
                className="border text-center py-4 text-gray-400"
              >
                No data
              </td>
            </tr>
          ) : (
            suppliers.map((s, i) => (
              <tr key={s.supplier_code}>
                <td className="border px-2 py-1 text-center">
                  {i + 1}
                </td>
                <td className="border px-2 py-1">
                  {s.supplier_code}
                </td>
                <td className="border px-2 py-1">
                  {s.supplier_name}
                </td>

                {QUARTERS.map((q) => {
                  const value = getValue(s.supplier_code, q);
                  const num = Number(value);

                  return (
                    <td
                      key={q}
                      className={`border px-2 py-1 text-center ${
                        num !== 0 ? "bg-yellow-300 font-semibold" : ""
                      }`}
                    >
                      {num}
                    </td>
                  );
                })}

              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
