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
  price: string; // dari DB string
};

export default function ViewPriceQuartersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  /* ================= LOAD SUPPLIER ================= */
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

  /* ================= UNIQUE IPD ================= */
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

  /* ================= DYNAMIC QUARTERS ================= */
  const quarters = Array.from(
    new Set(rows.map((r) => r.quarter))
  ).sort();

  function getPrice(ipd: string, quarter: string) {
    const found = rows.find(
      (r) => r.ipd === ipd && r.quarter === quarter
    );
    return found ? Number(found.price) : 0;
  }

  function diff(curr: number, prev: number) {
    if (prev === 0) return "-";
    return (((curr - prev) / prev) * 100).toFixed(2) + "%";
  }

  return (
    <div className="p-4 text-xs space-y-4">
      <h1 className="text-2xl font-bold">
        View Update Price Quarters
      </h1>

      {/* ================= SELECT SUPPLIER ================= */}
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

      {/* ================= SUPPLIER DETAIL ================= */}
      {supplier && (
        <div className="border p-2 bg-gray-50 space-y-1">
          <div>SUPPLIER: {supplier.supplier_name}</div>
          <div>ADDRESS: {supplier.address}</div>
          <div>CURRENCY: {supplier.currency}</div>
          <div>INCOTERM: {supplier.incoterm}</div>
          <div>TOP: {supplier.top}</div>
        </div>
      )}

      {/* ================= TABLE ================= */}
      {supplier && (
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] border">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-2">No</th>
                <th className="border px-2">IPD</th>
                <th className="border px-2">Description</th>
                <th className="border px-2">Material Source</th>

                {quarters.map((q) => (
                  <th key={q} className="border px-2">
                    {q}
                  </th>
                ))}

                {quarters.slice(1).map((q, i) => (
                  <th key={q} className="border px-2">
                    Diff {q} - {quarters[i]}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {ipds.length === 0 ? (
                <tr>
                  <td
                    colSpan={4 + quarters.length * 2}
                    className="border text-center py-4 text-gray-400"
                  >
                    No data
                  </td>
                </tr>
              ) : (
                ipds.map((i, idx) => {
                  const prices = quarters.map((q) =>
                    getPrice(i.ipd, q)
                  );

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

                      {prices.map((p, pi) => (
                        <td
                          key={pi}
                          className={`border px-2 text-right ${
                            p !== 0 ? "bg-yellow-100 font-semibold" : ""
                          }`}
                        >
                          {p.toFixed(4)}
                        </td>
                      ))}

                      {prices.slice(1).map((p, pi) => (
                        <td
                          key={pi}
                          className="border px-2 text-right"
                        >
                          {diff(p, prices[pi])}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
