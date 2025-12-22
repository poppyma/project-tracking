"use client";

import { useEffect, useState } from "react";

/* ================= TYPES ================= */
type TotalRow = {
  supplier_id: string;
  supplier_code: string;
  supplier_name: string;
  quarter: string;
  total_ipd: string;
};

export default function ViewTotalIPDPage() {
  const [rows, setRows] = useState<TotalRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/total");
      const json = await res.json();
      setRows(Array.isArray(json) ? json : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* UNIQUE SUPPLIER */
  const suppliers = Array.from(
    new Map(
      rows.map((r) => [
        r.supplier_id,
        {
          supplier_code: r.supplier_code,
          supplier_name: r.supplier_name,
        },
      ])
    ).values()
  );

  /* UNIQUE QUARTER */
  const quarters = Array.from(
    new Set(rows.map((r) => r.quarter))
  );

  function getTotal(
    supplierCode: string,
    quarter: string
  ) {
    const row = rows.find(
      (r) =>
        r.supplier_code === supplierCode &&
        r.quarter === quarter
    );
    return row ? row.total_ipd : "0";
  }

  return (
    <div className="p-4 space-y-4 text-xs">
      <h1 className="text-2xl font-bold">
        View Total Update IPD Price Summary by Supplier
      </h1>

      {loading && <div>Loading...</div>}

      {!loading && rows.length > 0 && (
        <table className="w-full border mt-4">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2 py-1">No</th>
              <th className="border px-2 py-1">
                Supplier Code
              </th>
              <th className="border px-2 py-1">
                Supplier Name
              </th>
              {quarters.map((q) => (
                <th
                  key={q}
                  className="border px-2 py-1"
                >
                  Total IPD {q}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {suppliers.map((s, i) => (
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

                {quarters.map((q) => (
                  <td
                    key={q}
                    className="border px-2 py-1 text-center"
                  >
                    {getTotal(s.supplier_code, q)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && rows.length === 0 && (
        <div className="text-gray-400">
          No data
        </div>
      )}
    </div>
  );
}
