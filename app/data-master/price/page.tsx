"use client";

import { useEffect, useState } from "react";

/* =========================
   TYPES
========================= */
type Supplier = {
  id: string;
  supplier_code: string;
  supplier_name: string;
  currency: string | null;
  incoterm: string | null;
  top: number | null;
};

type PriceRow = {
  id: string;
  supplier_name: string;
  supplier_code: string;
  ipd_quotation: string;
  ipd_siis: string;
  description: string;
  price: string;
};

/* =========================
   PAGE
========================= */
export default function InputPricePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    supplier_id: "",
    start_date: "",
    end_date: "",
    ipd_quotation: "",
    ipd_siis: "",
    description: "",
    steel_spec: "",
    material_source: "",
    tube_route: "",
    price: "",
  });

  /* =========================
     LOAD DATA
  ========================= */
  useEffect(() => {
    loadSuppliers();
    loadPrices();
  }, []);

  async function loadSuppliers() {
    const res = await fetch("/api/supplier");
    const json = await res.json();
    setSuppliers(json);
  }

  async function loadPrices() {
    const res = await fetch("/api/price");
    const json = await res.json();
    setPrices(json);
  }

  /* =========================
     SUBMIT
  ========================= */
  async function handleSubmit() {
    if (!form.supplier_id || !form.start_date || !form.price) {
      alert("Supplier, Start Date, dan Price wajib diisi");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
      setLoading(false);
      return;
    }

    alert("Quotation berhasil disimpan");

    setForm({
      supplier_id: "",
      start_date: "",
      end_date: "",
      ipd_quotation: "",
      ipd_siis: "",
      description: "",
      steel_spec: "",
      material_source: "",
      tube_route: "",
      price: "",
    });

    setSelectedSupplier(null);
    loadPrices();
    setLoading(false);
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="space-y-4 text-xs">

      <h1 className="font-semibold">Input Price Quotation</h1>

      {/* SUPPLIER */}
      <select
        className="input-dense w-72"
        value={form.supplier_id}
        onChange={(e) => {
          const supplier = suppliers.find(s => s.id === e.target.value);
          setSelectedSupplier(supplier ?? null);
          setForm({ ...form, supplier_id: e.target.value });
        }}
      >
        <option value="">-- Select Supplier --</option>
        {suppliers.map(s => (
          <option key={s.id} value={s.id}>
            {s.supplier_name}
          </option>
        ))}
      </select>

      {/* DETAIL SUPPLIER + DATE (DISIMPAN, TIDAK MASUK TABEL) */}
      {selectedSupplier && (
        <div className="border rounded p-3 bg-gray-50 space-y-2">

          <div className="grid grid-cols-3 gap-2">
            <div>
              <b>Supplier</b>
              <div>{selectedSupplier.supplier_name}</div>
            </div>
            <div>
              <b>Supplier Code</b>
              <div>{selectedSupplier.supplier_code}</div>
            </div>
            <div>
              <b>Currency</b>
              <div>{selectedSupplier.currency ?? "-"}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              className="input-dense"
              value={form.start_date}
              onChange={(e) =>
                setForm({ ...form, start_date: e.target.value })
              }
            />
            <input
              type="date"
              className="input-dense"
              value={form.end_date}
              onChange={(e) =>
                setForm({ ...form, end_date: e.target.value })
              }
            />
          </div>

        </div>
      )}

      {/* QUOTATION INPUT */}
      <div className="grid grid-cols-4 gap-2">
        {[
          ["IPD Quotation", "ipd_quotation"],
          ["IPD SIIS", "ipd_siis"],
          ["Description", "description"],
          ["Steel Spec", "steel_spec"],
          ["Material Source", "material_source"],
          ["Tube Route", "tube_route"],
        ].map(([label, key]) => (
          <input
            key={key}
            className="input-dense"
            placeholder={label}
            value={(form as any)[key]}
            onChange={(e) =>
              setForm({ ...form, [key]: e.target.value })
            }
          />
        ))}

        <input
          className="input-dense"
          placeholder="Price"
          value={form.price}
          onChange={(e) =>
            setForm({ ...form, price: e.target.value })
          }
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white rounded px-4"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      {/* TABLE (TANPA START & END DATE) */}
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th>Supplier</th>
            <th>IPD SIIS</th>
            <th>Description</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {prices.map(p => (
            <tr key={p.id}>
              <td>{p.supplier_name}</td>
              <td>{p.ipd_siis}</td>
              <td>{p.description}</td>
              <td>{p.price}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
