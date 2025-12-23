"use client";

import { useEffect, useMemo, useState } from "react";

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
  price: string;
};

/* ================= STORAGE KEY ================= */
const STORAGE_KEY = "view_siis_supplier_state";

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
  Q1: [0, 1, 2],
  Q2: [3, 4, 5],
  Q3: [6, 7, 8],
  Q4: [9, 10, 11],
};

export default function ViewSIISPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedQuarter, setSelectedQuarter] =
    useState<string>("");

  /* LOAD SUPPLIERS */
  useEffect(() => {
    fetch("/api/supplier")
      .then((r) => r.json())
      .then(setSuppliers);
  }, []);

  /* RESTORE STATE ON REFRESH */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      setSupplier(parsed.supplier || null);
      setRows(parsed.rows || []);
      setSelectedQuarter(parsed.selectedQuarter || "");
    } catch (err) {
      console.error("Restore SIIS state error:", err);
    }
  }, []);

  /* SAVE STATE */
  useEffect(() => {
    if (!supplier) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        supplier,
        rows,
        selectedQuarter,
      })
    );
  }, [supplier, rows, selectedQuarter]);

  async function loadData(s: Supplier) {
    const res = await fetch(`/api/siis?supplier_id=${s.id}`);
    const json = await res.json();
    const data: Row[] = Array.isArray(json) ? json : [];

    setSupplier(s);
    setRows(data);

    const qs = Array.from(new Set(data.map((r) => r.quarter)));
    setSelectedQuarter(qs.length === 1 ? qs[0] : "");
  }

  /* UNIQUE QUARTERS */
  const quarters = useMemo(
    () => Array.from(new Set(rows.map((r) => r.quarter))),
    [rows]
  );

  /* FILTER BY QUARTER */
  const filteredRows = useMemo(() => {
    if (!selectedQuarter) return rows;
    return rows.filter((r) => r.quarter === selectedQuarter);
  }, [rows, selectedQuarter]);

  /* GROUP IPD */
  const ipds = useMemo(
    () =>
      Array.from(
        new Map(
          filteredRows.map((r) => [
            r.ipd,
            {
              ipd: r.ipd,
              description: r.description,
              material_source: r.material_source,
            },
          ])
        ).values()
      ),
    [filteredRows]
  );

  /* GET MONTH PRICE */
  function getMonthPrice(ipd: string, monthIndex: number) {
    for (const r of filteredRows) {
      const q = r.quarter.split("-")[0];
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
        value={supplier?.id || ""}
        onChange={(e) => {
          const s = suppliers.find(
            (x) => x.id === e.target.value
          );
          if (s) loadData(s);
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

          {/* PRICE VALIDITY */}
          <div className="flex items-center gap-2">
            <span>PRICE VALIDITY:</span>

            {quarters.length <= 1 ? (
              <strong>{quarters[0]}</strong>
            ) : (
              <select
                className="border px-2 py-0.5"
                value={selectedQuarter}
                onChange={(e) =>
                  setSelectedQuarter(e.target.value)
                }
              >
                <option value="">
                  -- Select Quarter --
                </option>
                {quarters.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* TABLE */}
      {supplier && selectedQuarter && (
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
