"use client";

import { useEffect, useState } from "react";

/* =========================
   TYPES
========================= */
type Supplier = {
  id: string;
  supplier_code: string;
  supplier_name: string;
  currency: string;
  incoterm: string;
  top: number;
};

type PriceRow = {
  id: string;
  ipd_quotation: string;
  ipd_siis: string;
  description: string;
  steel_spec: string;
  material_source: string;
  tube_route: string;
  price: string;
};

/* =========================
   UTILS
========================= */
export default function PricePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [form, setForm] = useState({
    ipd_quotation: "",
    ipd_siis: "",
    description: "",
    steel_spec: "",
    material_source: "",
    tube_route: "",
    price: "",
  });

  const [rows, setRows] = useState<PriceRow[]>([]);
  const [showForm, setShowForm] = useState(false);

  /* =========================
     LOAD SUPPLIER
  ========================= */
  useEffect(() => {
    fetch("/api/supplier")
      .then((r) => r.json())
      .then(setSuppliers);
  }, []);

  /* =========================
     LOAD PRICE
  ========================= */
 async function loadPrice(supplierId: string) {
  try {
    const res = await fetch(`/api/price?supplier_id=${supplierId}`);
    const json = await res.json();

    if (!Array.isArray(json)) {
      console.error("PRICE API ERROR:", json);
      setRows([]);
      return;
    }

    setRows(json);
  } catch (err) {
    console.error("LOAD PRICE ERROR:", err);
    setRows([]);
  }
}

function getQuarterLabel(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const month = date.getMonth(); // 0 = Jan
  const year = date.getFullYear();

  const quarter = Math.floor(month / 3) + 1; // Q1-Q4
  return `Q${quarter} ${year}`;
}

  /* =========================
     SAVE
  ========================= */
 async function handleSave() {
  if (!selectedSupplier || !startDate || !form.price) {
    alert("Supplier, Start Date & Price wajib diisi");
    return;
  }

  setLoading(true); // mulai loading
  try {
    const res = await fetch("/api/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplier_id: selectedSupplier.id,
        start_date: startDate,
        end_date: endDate || null,
        ipd_quotation: form.ipd_quotation || null,
        ipd_siis: form.ipd_siis || null,
        description: form.description || null,
        steel_spec: form.steel_spec || null,
        material_source: form.material_source || null,
        tube_route: form.tube_route || null,
        price: Number(form.price),
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Gagal simpan data");
      return;
    }

    alert("Data berhasil disimpan!");
    setForm({
      ipd_quotation: "",
      ipd_siis: "",
      description: "",
      steel_spec: "",
      material_source: "",
      tube_route: "",
      price: "",
    });
    setShowForm(false);
    if (selectedSupplier) await loadPrice(selectedSupplier.id);
  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan saat menyimpan data");
  } finally {
    setLoading(false); // selesai loading
  }
}




  return (
    <div className="space-y-4 text-xs">

      {/* SUPPLIER SELECT */}
      <select
        className="border px-2 py-1"
        onChange={(e) => {
          const s = suppliers.find(x => x.id === e.target.value);
          setSelectedSupplier(s || null);
          if (s) loadPrice(s.id);
        }}
      >
        <option value="">-- Select Supplier --</option>
        {suppliers.map(s => (
          <option key={s.id} value={s.id}>
            {s.supplier_code} - {s.supplier_name}
          </option>
        ))}
      </select>

      {/* SUPPLIER DETAIL */}
      {selectedSupplier && (
        <div className="border p-2 bg-gray-50">
          <div>Supplier Code: {selectedSupplier.supplier_code}</div>
          <div>Currency: {selectedSupplier.currency}</div>
          <div>Incoterm: {selectedSupplier.incoterm}</div>
          <div>TOP: {selectedSupplier.top}</div>

          <div className="mt-2 flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border px-2 py-1 text-xs h-7"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border px-2 py-1 text-xs h-7"
            />

            {/* Tampilkan Quarter */}
            {endDate && (
              <span className="text-sm font-medium px-2 py-1 bg-gray-100 border rounded">
                {getQuarterLabel(endDate)}
              </span>
            )}
          </div>

        </div>
      )}

      {/* ADD BUTTON */}
      {selectedSupplier && (
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          + Add Price
        </button>
      )}

      {/* FORM */}
      {showForm && (
        <div className="grid grid-cols-4 gap-2 border p-3">
          {Object.entries(form).map(([k, v]) => (
            <input
              key={k}
              placeholder={k.replace("_", " ").toUpperCase()}
              value={v}
              onChange={e => setForm({ ...form, [k]: e.target.value })}
              className="border px-2 py-1"
            />
          ))}

          <div className="col-span-4 flex justify-end gap-2">
            <button onClick={() => setShowForm(false)}>Cancel</button>
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-1"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>

          </div>
        </div>
      )}

      <table className="w-full border text-xs">
  <thead className="bg-gray-100">
    <tr>
      <th className="border px-2 py-1">IPD SIIS</th>
      <th className="border px-2 py-1">Description</th>
      <th className="border px-2 py-1">Steel Spec</th>
      <th className="border px-2 py-1">Material Source</th>
      <th className="border px-2 py-1">Tube Route</th>
      <th className="border px-2 py-1">Price</th>
    </tr>
  </thead>

  <tbody>
    {rows.length === 0 ? (
      <tr>
        <td colSpan={6} className="text-center py-3 text-gray-400">
          No data
        </td>
      </tr>
    ) : (
      rows.map((r) => (
        <tr key={r.id}>
          <td className="border px-2 py-1">{r.ipd_siis}</td>
          <td className="border px-2 py-1">{r.description}</td>
          <td className="border px-2 py-1">{r.steel_spec}</td>
          <td className="border px-2 py-1">{r.material_source}</td>
          <td className="border px-2 py-1">{r.tube_route}</td>
          <td className="border px-2 py-1">{r.price}</td>
        </tr>
      ))
    )}
  </tbody>
</table>

    </div>
  );
}
