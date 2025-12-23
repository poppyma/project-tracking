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

export default function ViewPricePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [quarters, setQuarters] = useState<string[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState("");
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(false);

  // load supplier
  useEffect(() => {
    fetch("/api/supplier")
      .then((r) => r.json())
      .then(setSuppliers);
  }, []);

  // load quarter when supplier changed
  useEffect(() => {
    if (!selectedSupplier) {
      setQuarters([]);
      setSelectedQuarter("");
      setRows([]);
      return;
    }

    fetch(`/api/price?list_quarter=true&supplier_id=${selectedSupplier.id}`)
      .then((r) => r.json())
      .then((data: string[]) => {
        setQuarters(data);
        setSelectedQuarter("");
        setRows([]);
      });
  }, [selectedSupplier]);

  async function fetchPrice() {
    if (!selectedSupplier) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        supplier_id: selectedSupplier.id,
      });
      if (selectedQuarter) params.append("quarter", selectedQuarter);

      const res = await fetch(`/api/price?${params.toString()}`);
      const data = await res.json();
      setRows(data);
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // ambil header info (start & end date)
  const headerInfo = rows.length > 0 ? rows[0] : null;

  return (
    <div className="p-4 space-y-4 text-xs">
      <h1 className="text-xl font-semibold">View Price</h1>

      {/* FILTER */}
      <div className="flex gap-2">
        <select
          className="border px-2 py-1"
          onChange={(e) =>
            setSelectedSupplier(
              suppliers.find((s) => s.id === e.target.value) || null
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
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={fetchPrice}
          disabled={!selectedSupplier || loading}
        >
          {loading ? "Loading..." : "View Price"}
        </button>
      </div>

      {/* DETAIL SUPPLIER */}
      {selectedSupplier && (
        <div className="border rounded bg-gray-50 p-3 grid grid-cols-3 gap-2">
          <div><b>Supplier Code:</b> {selectedSupplier.supplier_code}</div>
          <div><b>Supplier Name:</b> {selectedSupplier.supplier_name}</div>
          <div><b>Currency:</b> {selectedSupplier.currency}</div>

          <div><b>Incoterm:</b> {selectedSupplier.incoterm}</div>
          <div><b>TOP:</b> {selectedSupplier.top} Days</div>
          <div><b>Quarter:</b> {selectedQuarter || "-"}</div>

          <div><b>Start Date:</b> {headerInfo?.start_date || "-"}</div>
          <div><b>End Date:</b> {headerInfo?.end_date || "-"}</div>
        </div>
      )}

      {/* TABLE */}
      <div className="border rounded bg-white p-3 overflow-x-auto">
        <table className="min-w-[900px] border text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1 w-10 text-center">No</th>
              <th className="border px-2 py-1">IPD</th>
              <th className="border px-2 py-1">Description</th>
              <th className="border px-2 py-1">Steel Spec</th>
              <th className="border px-2 py-1">Material Source</th>
              <th className="border px-2 py-1">Tube Route</th>
              <th className="border px-2 py-1 text-right">Price</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-3 text-gray-400">
                  No data
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.detail_id}>
                  <td className="border px-2 py-1 text-center">{i + 1}</td>
                  <td className="border px-2 py-1">{r.ipd_siis}</td>
                  <td className="border px-2 py-1">{r.description}</td>
                  <td className="border px-2 py-1">{r.steel_spec}</td>
                  <td className="border px-2 py-1">{r.material_source}</td>
                  <td className="border px-2 py-1">{r.tube_route}</td>
                  <td className="border px-2 py-1 text-right">
                    {Number(r.price).toLocaleString()}
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
