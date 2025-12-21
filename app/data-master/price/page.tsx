"use client";

import { useEffect, useState } from "react";

type PriceRow = {
  id: string;
  ipd: string;
  description: string;
  steel_spec: string;
  material_source: string;
  tube_route: string;
  price: number;
};

export default function InputPricePage() {
  const [data, setData] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    ipd: "",
    description: "",
    steel_spec: "",
    material_source: "",
    tube_route: "",
    price: "",
  });

  /* =========================
     Load Data
  ========================= */
  async function loadData() {
    const res = await fetch("/api/price");
    const json = await res.json();
    setData(json);
  }

  useEffect(() => {
    loadData();
  }, []);

  /* =========================
     Submit
  ========================= */
  async function handleSubmit() {
    if (!form.ipd || !form.price) {
      alert("IPD dan Price wajib diisi");
      return;
    }

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
      alert("Gagal menyimpan price");
      return;
    }

    setForm({
      ipd: "",
      description: "",
      steel_spec: "",
      material_source: "",
      tube_route: "",
      price: "",
    });

    loadData();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Input Price</h1>

      {/* FORM */}
      <div className="grid grid-cols-3 gap-4">
        <input
          className="input"
          placeholder="IPD"
          value={form.ipd}
          onChange={(e) => setForm({ ...form, ipd: e.target.value })}
        />

        <input
          className="input"
          placeholder="Description"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        <input
          className="input"
          placeholder="Steel Spec"
          value={form.steel_spec}
          onChange={(e) =>
            setForm({ ...form, steel_spec: e.target.value })
          }
        />

        <input
          className="input"
          placeholder="Material Source"
          value={form.material_source}
          onChange={(e) =>
            setForm({ ...form, material_source: e.target.value })
          }
        />

        <input
          className="input"
          placeholder="Tube Route"
          value={form.tube_route}
          onChange={(e) =>
            setForm({ ...form, tube_route: e.target.value })
          }
        />

        <input
          className="input"
          placeholder="Price"
          type="number"
          value={form.price}
          onChange={(e) =>
            setForm({ ...form, price: e.target.value })
          }
        />
      </div>

      {/* SAVE */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save"}
      </button>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th>IPD</th>
              <th>Description</th>
              <th>Steel Spec</th>
              <th>Material Source</th>
              <th>Tube Route</th>
              <th>Price</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-400">
                  No data
                </td>
              </tr>
            )}

            {data.map((row) => (
              <tr key={row.id}>
                <td>{row.ipd}</td>
                <td>{row.description}</td>
                <td>{row.steel_spec}</td>
                <td>{row.material_source}</td>
                <td>{row.tube_route}</td>
                <td>{row.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
