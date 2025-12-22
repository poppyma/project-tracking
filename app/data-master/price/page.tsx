"use client";

import { useEffect, useState } from "react";

export default function PricePage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [prices, setPrices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
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

  /* =======================
     FETCH SUPPLIERS
  ======================= */
  useEffect(() => {
    fetch("/api/supplier")
      .then(res => res.json())
      .then(setSuppliers);
  }, []);

  /* =======================
     FETCH PRICE BY SUPPLIER
  ======================= */
  const fetchPrices = async (supplierId: string) => {
    const res = await fetch(`/api/price/view?supplier_id=${supplierId}`);
    const data = await res.json();
    setPrices(data);
  };

  /* =======================
     HANDLE SUPPLIER CHANGE
  ======================= */
  const handleSupplierChange = (id: string) => {
    const supplier = suppliers.find(s => s.id === id);
    setSelectedSupplier(supplier);
    setShowForm(false);
    fetchPrices(id);
  };

  /* =======================
     HANDLE SAVE
  ======================= */
  const handleSave = async () => {
    const res = await fetch("/api/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplier_id: selectedSupplier.id,
        ...form,
        price: Number(form.price),
      }),
    });

    if (!res.ok) {
      alert("Gagal menyimpan data");
      return;
    }

    setForm({
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

    setShowForm(false);
    fetchPrices(selectedSupplier.id);
  };

  return (
    <div className="p-6 space-y-6">

      {/* ================= SUPPLIER SELECT ================= */}
      <div>
        <label className="font-medium">Supplier</label>
        <select
          className="border rounded px-3 py-2 w-full"
          onChange={e => handleSupplierChange(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>-- Select Supplier --</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>
              {s.supplier_code} - {s.supplier_name}
            </option>
          ))}
        </select>
      </div>

      {/* ================= SUPPLIER DETAIL ================= */}
      {selectedSupplier && (
        <div className="border rounded p-4 bg-gray-50 space-y-2">
          <div><b>Supplier Code:</b> {selectedSupplier.supplier_code}</div>
          <div><b>Currency:</b> {selectedSupplier.currency}</div>
          <div><b>Incoterm:</b> {selectedSupplier.incoterm}</div>
          <div><b>TOP:</b> {selectedSupplier.top}</div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label>Start Date</label>
              <input
                type="date"
                className="border rounded px-3 py-2 w-full"
                value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div>
              <label>End Date</label>
              <input
                type="date"
                className="border rounded px-3 py-2 w-full"
                value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD BUTTON ================= */}
      {selectedSupplier && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          + Add Price
        </button>
      )}

      {/* ================= INPUT FORM ================= */}
      {showForm && (
        <div className="border rounded p-4 space-y-3">
          {[
            ["IPD Quotation", "ipd_quotation"],
            ["IPD SIIS", "ipd_siis"],
            ["Description", "description"],
            ["Steel Spec", "steel_spec"],
            ["Material Source", "material_source"],
            ["Tube Route", "tube_route"],
          ].map(([label, key]) => (
            <div key={key}>
              <label>{label}</label>
              <input
                className="border rounded px-3 py-2 w-full"
                value={(form as any)[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}

          <div>
            <label>Price</label>
            <input
              type="number"
              className="border rounded px-3 py-2 w-full"
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">
              Save
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ================= RESULT TABLE ================= */}
      {prices.length > 0 && (
        <table className="w-full border mt-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2">IPD Quotation</th>
              <th className="border px-2">IPD SIIS</th>
              <th className="border px-2">Steel Spec</th>
              <th className="border px-2">Price</th>
            </tr>
          </thead>
          <tbody>
            {prices.map(p => (
              <tr key={p.id}>
                <td className="border px-2">{p.ipd_quotation}</td>
                <td className="border px-2">{p.ipd_siis}</td>
                <td className="border px-2">{p.steel_spec}</td>
                <td className="border px-2">{p.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
