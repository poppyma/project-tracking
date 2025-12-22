"use client";

import { useEffect, useState } from "react";

type PriceRow = {
  id: string;
  ipd: string;
  supplier_code: string;
  description: string;
  steel_spec: string;
  material_source: string;
  tube_route: string;
  currency: string;
  incoterm: string;
  top: number;
  start_date: string;
  end_date: string;
  price: string;
};

const PAGE_SIZE = 50;

export default function InputPricePage() {
  const [data, setData] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    ipd: "",
    supplier_code: "",
    description: "",
    steel_spec: "",
    material_source: "",
    tube_route: "",
    currency: "",
    incoterm: "",
    top: "",
    start_date: "",
    end_date: "",
    price: "",
  });

  async function loadData() {
    const res = await fetch("/api/price");
    setData(await res.json());
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit() {
    if (!form.ipd || !form.supplier_code || !form.price || !form.start_date) {
      alert("IPD, Supplier, Start Date, dan Price wajib diisi");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        top: form.top ? Number(form.top) : null,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      alert("Gagal menyimpan price");
      return;
    }

    alert("Price berhasil disimpan");
    resetForm();
    loadData();
  }

  function resetForm() {
    setForm({
      ipd: "",
      supplier_code: "",
      description: "",
      steel_spec: "",
      material_source: "",
      tube_route: "",
      currency: "",
      incoterm: "",
      top: "",
      start_date: "",
      end_date: "",
      price: "",
    });
    setShowForm(false);
  }

  const filtered = data.filter(
    (r) =>
      r.ipd.toLowerCase().includes(search.toLowerCase()) ||
      r.supplier_code.toLowerCase().includes(search.toLowerCase())
  );

  const paged = filtered.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  );

  return (
    <div className="space-y-2">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-sm font-semibold">Update Price</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white"
        >
          {showForm ? "Close" : "+ Add Price"}
        </button>
      </div>

      {/* SEARCH */}
      <input
        className="input-dense w-64 text-xs"
        placeholder="Search IPD / Supplier"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* FORM */}
      {showForm && (
        <div className="bg-white border rounded p-3 grid grid-cols-4 gap-2 text-xs">

          {[
            ["IPD", "ipd"],
            ["Supplier Code", "supplier_code"],
            ["Description", "description"],
            ["Steel Spec", "steel_spec"],
            ["Material Source", "material_source"],
            ["Tube Route", "tube_route"],
            ["Currency", "currency"],
            ["Incoterm", "incoterm"],
            ["TOP", "top"],
            ["Start Date", "start_date"],
            ["End Date", "end_date"],
            ["Price", "price"],
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

          <div className="col-span-4 flex justify-end gap-2">
            <button onClick={resetForm} className="px-3 py-1 border rounded">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-1 bg-blue-600 text-white rounded"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white border rounded p-3">
        <table className="w-full border text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">IPD</th>
              <th className="border px-2 py-1">Supplier</th>
              <th className="border px-2 py-1">Start</th>
              <th className="border px-2 py-1">End</th>
              <th className="border px-2 py-1">Price</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <tr key={r.id}>
                <td className="border px-2 py-1">{r.ipd}</td>
                <td className="border px-2 py-1">{r.supplier_code}</td>
                <td className="border px-2 py-1">{r.start_date}</td>
                <td className="border px-2 py-1">{r.end_date}</td>
                <td className="border px-2 py-1">{r.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
