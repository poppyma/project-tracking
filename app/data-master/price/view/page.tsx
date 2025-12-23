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
  detail_id: string;
  ipd_quotation: string;
  ipd_siis: string;
  description: string;
  steel_spec: string;
  material_source: string;
  tube_route: string;
  price: string;
};

/* ================= STORAGE KEY ================= */
const STORAGE_KEY = "view-price-state";

export default function ViewPricePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] =
    useState<Supplier | null>(null);
  const [quarters, setQuarters] = useState<string[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(false);

  const headerInfo = rows.length > 0 ? rows[0] : null;

  /* ================= LOAD SUPPLIERS ================= */
  useEffect(() => {
    fetch("/api/supplier")
      .then((r) => r.json())
      .then(setSuppliers);
  }, []);

  /* ================= LOAD SAVED STATE ================= */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved || suppliers.length === 0) return;

    const parsed = JSON.parse(saved);
    const supplier = suppliers.find(
      (s) => s.id === parsed.supplier_id
    );

    if (!supplier) return;

    setSelectedSupplier(supplier);
    setSelectedQuarter(parsed.quarter || "");

    fetch(
      `/api/price?list_quarter=true&supplier_id=${supplier.id}`
    )
      .then((r) => r.json())
      .then((qList: string[]) => {
        setQuarters(qList);
        fetchPrice(supplier.id, parsed.quarter);
      });
  }, [suppliers]);

  /* ================= LOAD QUARTERS ================= */
  useEffect(() => {
    if (!selectedSupplier) {
      setQuarters([]);
      setSelectedQuarter("");
      setRows([]);
      return;
    }

    fetch(
      `/api/price?list_quarter=true&supplier_id=${selectedSupplier.id}`
    )
      .then((r) => r.json())
      .then((data: string[]) => {
        setQuarters(data);
        setSelectedQuarter("");
        setRows([]);
      });
  }, [selectedSupplier]);

  /* ================= FETCH PRICE ================= */
  async function fetchPrice(
    supplierId?: string,
    quarterVal?: string
  ) {
    const sId = supplierId || selectedSupplier?.id;
    const qVal = quarterVal ?? selectedQuarter;

    if (!sId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        supplier_id: sId,
      });
      if (qVal) params.append("quarter", qVal);

      const res = await fetch(`/api/price?${params.toString()}`);
      const data = await res.json();
      setRows(data);

      // 🔥 SAVE STATE
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          supplier_id: sId,
          quarter: qVal,
        })
      );
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4 text-xs">
      <h1 className="text-2xl font-bold">View Price</h1>

      {/* ================= FILTER ================= */}
      <div className="flex gap-2">
        <select
          className="border px-2 py-1"
          value={selectedSupplier?.id || ""}
          onChange={(e) =>
            setSelectedSupplier(
              suppliers.find((s) => s.id === e.target.value) ||
                null
            )
          }
        >
          <option value="">-- Select Supplier --</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.supplier_code} - {s.supplier_name}
            </option>
          ))}
        </select>

        <select
          className="border px-2 py-1"
          value={selectedQuarter}
          onChange={(e) => setSelectedQuarter(e.target.value)}
          disabled={quarters.length === 0}
        >
          <option value="">-- Select Quarter --</option>
          {quarters.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>

        <button
          className="bg-blue-600 text-white px-3 py-1"
          onClick={() => fetchPrice()}
          disabled={!selectedSupplier || loading}
        >
          {loading ? "Loading..." : "View Price"}
        </button>
      </div>

      {/* ================= SUPPLIER DETAIL ================= */}
      {selectedSupplier && (
        <div className="border rounded bg-gray-50 p-3 grid grid-cols-2 gap-2">
          <div>
            <b>Supplier Code:</b>{" "}
            {selectedSupplier.supplier_code}
          </div>
          <div>
            <b>Supplier Name:</b>{" "}
            {selectedSupplier.supplier_name}
          </div>
          <div>
            <b>Currency:</b> {selectedSupplier.currency}
          </div>
          <div>
            <b>Incoterm:</b> {selectedSupplier.incoterm}
          </div>
          <div>
            <b>TOP:</b> {selectedSupplier.top} Days
          </div>
          <div>
            <b>Quarter:</b> {selectedQuarter || "-"}
          </div>
          <div>
            <b>Start Date:</b>{" "}
            {headerInfo?.start_date || "-"}
          </div>
          <div>
            <b>End Date:</b>{" "}
            {headerInfo?.end_date || "-"}
          </div>
        </div>
      )}

      {/* ================= TABLE ================= */}
      <div className="overflow-x-auto">
        <table className="min-w-[1000px] border text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1 w-10 text-center">
                No
              </th>
              <th className="border px-2 py-1">IPD</th>
              <th className="border px-2 py-1">
                Description
              </th>
              <th className="border px-2 py-1">
                Steel Spec
              </th>
              <th className="border px-2 py-1">
                Material Source
              </th>
              <th className="border px-2 py-1">
                Tube Route
              </th>
              <th className="border px-2 py-1">
                Price
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="border py-4 text-center text-gray-400"
                >
                  No data
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.detail_id}>
                  <td className="border px-2 py-1 text-center">
                    {i + 1}
                  </td>
                  <td className="border px-2 py-1">
                    {r.ipd_siis}
                  </td>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
