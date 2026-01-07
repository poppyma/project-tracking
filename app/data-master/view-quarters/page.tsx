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
  ipd_quotation: string;
  ipd: string | null;
  material_source: string | null;
  quarter: string;
  price: string;
};

/* ================= FIXED QUARTERS ================= */
const QUARTERS = ["Q4-2025", "Q1-2026", "Q2-2025", "Q3-2025"];

/* ================= STORAGE KEY ================= */
const STORAGE_KEY = "view_price_quarters_state";

export default function ViewPriceQuartersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  async function fetchPriceQuarters(supplierId: string) {
    try {
      const res = await fetch(
        `/api/price-quarters?supplier_id=${supplierId}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      setRows(Array.isArray(json) ? json : []);
    } catch (e) {
      console.error("Failed fetch price quarters", e);
      setRows([]);
    }
  }

  /* ================= LOAD SUPPLIER LIST ================= */
  useEffect(() => {
    fetch("/api/supplier")
      .then((r) => r.json())
      .then(setSuppliers)
      .catch(console.error);
  }, []);

  /* ================= RESTORE SUPPLIER ================= */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (parsed?.supplier) {
        setSupplier(parsed.supplier);
      }
    } catch {}
  }, []);

  /* ================= FETCH WHEN SUPPLIER READY ================= */
  useEffect(() => {
    if (!supplier?.id) return;
    fetchPriceQuarters(supplier.id);
  }, [supplier?.id]);

  /* ================= SAVE SUPPLIER ================= */
  useEffect(() => {
    if (!supplier) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ supplier })
    );
  }, [supplier]);

  async function loadData(supplierId: string, selected: Supplier) {
    setSupplier(selected);
    fetchPriceQuarters(supplierId);
  }

  function formatPrice(value: number) {
    return value === 0 ? "-" : value.toFixed(4);
  }

  /* ================= GROUP BY IPD ================= */
  const ipds = Array.from(
  new Map(
    rows
      .filter(r => r.ipd && r.ipd.trim() !== "")
      .map((r) => [
        r.ipd_quotation,
        {
          ipd: r.ipd!,
          material_source: r.material_source || "-",
        },
      ])
  ).values()
);

  

  function getPrice(ipd: string, quarter: string) {
    const found = rows.find(
      (r) =>
        (r.ipd || r.ipd_quotation) === ipd &&
        r.quarter === quarter
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
        value={supplier?.id || ""}
        onChange={(e) => {
          const s = suppliers.find(
            (x) => x.id === e.target.value
          );
          if (s) loadData(s.id, s);
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
              <th className="border px-2">Steel Supplier</th>
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
                <tr key={i.ipd + idx}>
                  <td className="border px-2 text-center">
                    {idx + 1}
                  </td>
                  <td className="border px-2">{i.ipd}</td>
                  <td className="border px-2">{i.material_source}</td>

                  <td className="border px-2 text-right">{formatPrice(q4)}</td>
                  <td className="border px-2 text-right">{formatPrice(q1)}</td>
                  <td className="border px-2 text-right">{formatPrice(q2)}</td>
                  <td className="border px-2 text-right">{formatPrice(q3)}</td>

                  <td className="border px-2">{diff(q1, q4)}</td>
                  <td className="border px-2">{diff(q2, q1)}</td>
                  <td className="border px-2">{diff(q3, q2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
