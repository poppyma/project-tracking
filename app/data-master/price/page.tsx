"use client";

import { useEffect, useState } from "react";

type Supplier = {
  id: string;
  supplier_name: string;
  currency: string;
  incoterm: string;
  top: number | null;
};

export default function InputPricePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    supplier_id: "",
    start_date: "",
    end_date: "",
    quarter: "",
    year: new Date().getFullYear(),
    price: "",
  });

  /* ===== LOAD SUPPLIER MASTER ===== */
  useEffect(() => {
    fetch("/api/supplier")
      .then((r) => r.json())
      .then(setSuppliers)
      .catch(console.error);
  }, []);

  function calcQuarter(date: string) {
    const m = new Date(date).getMonth() + 1;
    return m <= 3 ? "Q1" : m <= 6 ? "Q2" : m <= 9 ? "Q3" : "Q4";
  }

  async function handleSubmit() {
    if (!form.supplier_id || !form.start_date || !form.price) {
      alert("Supplier, Start Date, dan Price wajib diisi");
      return;
    }

    setLoading(true);

    await fetch("/api/price-input", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quarter: calcQuarter(form.start_date),
      }),
    });

    setLoading(false);
    alert("Price berhasil disimpan");

    setForm({
      supplier_id: "",
      start_date: "",
      end_date: "",
      quarter: "",
      year: new Date().getFullYear(),
      price: "",
    });
  }

  const selectedSupplier = suppliers.find(
    (s) => s.id === form.supplier_id
  );

  return (
    <div className="space-y-3 text-xs max-w-xl">

      <h1 className="font-semibold">Input Price</h1>

      {/* SUPPLIER DROPDOWN */}
      <select
        className="input-dense w-full"
        value={form.supplier_id}
        onChange={(e) =>
          setForm({ ...form, supplier_id: e.target.value })
        }
      >
        <option value="">-- Select Supplier --</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.supplier_name}
          </option>
        ))}
      </select>

      {/* SUPPLIER DETAIL */}
      {selectedSupplier && (
        <div className="border rounded p-2 bg-gray-50 space-y-1">
          <div><b>Currency:</b> {selectedSupplier.currency}</div>
          <div><b>Incoterm:</b> {selectedSupplier.incoterm}</div>
          <div><b>TOP:</b> {selectedSupplier.top}</div>
        </div>
      )}

      {/* DATE */}
      <input
        type="date"
        className="input-dense w-full"
        value={form.start_date}
        onChange={(e) =>
          setForm({ ...form, start_date: e.target.value })
        }
      />

      <input
        type="date"
        className="input-dense w-full"
        value={form.end_date}
        onChange={(e) =>
          setForm({ ...form, end_date: e.target.value })
        }
      />

      {/* PRICE */}
      <input
        className="input-dense w-full"
        placeholder="Price"
        value={form.price}
        onChange={(e) =>
          setForm({ ...form, price: e.target.value })
        }
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-4 py-1 bg-blue-600 text-white rounded"
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
