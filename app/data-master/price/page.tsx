"use client";

import { useEffect, useState } from "react";

export default function PriceInputPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [ipds, setIpds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    supplier_id: "",
    ipd_id: "",
    start_date: "",
    end_date: "",
    quarter: "",
    year: new Date().getFullYear(),
    price: "",
  });

  useEffect(() => {
    fetch("/api/supplier")
      .then((res) => res.json())
      .then(setSuppliers);

    fetch("/api/ipd")
      .then((res) => res.json())
      .then(setIpds);
  }, []);

  const submit = async () => {
    setLoading(true);

    const res = await fetch("/api/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      alert("Gagal simpan data");
      return;
    }

    alert("Data berhasil disimpan");
    setForm({
      supplier_id: "",
      ipd_id: "",
      start_date: "",
      end_date: "",
      quarter: "",
      year: new Date().getFullYear(),
      price: "",
    });
  };

  return (
    <div className="p-6 max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Input Price</h1>

      {/* Supplier */}
      <select
        className="border p-2 w-full"
        value={form.supplier_id}
        onChange={(e) =>
          setForm({ ...form, supplier_id: e.target.value })
        }
      >
        <option value="">Pilih Supplier</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.supplier_name} ({s.supplier_code})
          </option>
        ))}
      </select>

      {/* IPD */}
      <select
        className="border p-2 w-full"
        value={form.ipd_id}
        onChange={(e) =>
          setForm({ ...form, ipd_id: e.target.value })
        }
      >
        <option value="">Pilih IPD</option>
        {ipds.map((i) => (
          <option key={i.id} value={i.id}>
            {i.ipd_siis}
          </option>
        ))}
      </select>

      {/* Date */}
      <input
        type="date"
        className="border p-2 w-full"
        value={form.start_date}
        onChange={(e) =>
          setForm({ ...form, start_date: e.target.value })
        }
      />

      <input
        type="date"
        className="border p-2 w-full"
        value={form.end_date}
        onChange={(e) =>
          setForm({ ...form, end_date: e.target.value })
        }
      />

      {/* Quarter */}
      <select
        className="border p-2 w-full"
        value={form.quarter}
        onChange={(e) =>
          setForm({ ...form, quarter: e.target.value })
        }
      >
        <option value="">Pilih Quarter</option>
        <option value="Q1">Q1</option>
        <option value="Q2">Q2</option>
        <option value="Q3">Q3</option>
        <option value="Q4">Q4</option>
      </select>

      {/* Price */}
      <input
        type="number"
        className="border p-2 w-full"
        placeholder="Price"
        value={form.price}
        onChange={(e) =>
          setForm({ ...form, price: e.target.value })
        }
      />

      <button
        onClick={submit}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
