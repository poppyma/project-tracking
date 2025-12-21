"use client";

import { useEffect, useState } from "react";

type Supplier = {
  id: string;
  supplier_code: string;
  supplier_name: string;
  address: string;
  country: string;
  pic: string;
  email: string;
  category: string;
  currency: string;
  incoterm: string;
  top: number;
  forwarder: string;
};

export default function InputSupplierPage() {
  const [data, setData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    supplier_code: "",
    supplier_name: "",
    address: "",
    country: "",
    pic: "",
    email: "",
    category: "",
    currency: "",
    incoterm: "",
    top: "",
    forwarder: "",
  });

  /* =========================
     Load Data
  ========================= */
  async function loadData() {
    const res = await fetch("/api/supplier");
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
    if (!form.supplier_code || !form.supplier_name) {
      alert("Supplier Code & Name wajib diisi");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/supplier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        top: form.top ? Number(form.top) : null,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      alert("Gagal menyimpan supplier");
      return;
    }

    setForm({
      supplier_code: "",
      supplier_name: "",
      address: "",
      country: "",
      pic: "",
      email: "",
      category: "",
      currency: "",
      incoterm: "",
      top: "",
      forwarder: "",
    });

    loadData();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Input Supplier</h1>

      {/* FORM */}
      <div className="grid grid-cols-4 gap-4">
        {[
          ["Supplier Code", "supplier_code"],
          ["Supplier Name", "supplier_name"],
          ["Address", "address"],
          ["Country", "country"],
          ["PIC", "pic"],
          ["Email", "email"],
          ["Category", "category"],
          ["Currency", "currency"],
          ["Incoterm", "incoterm"],
          ["TOP (days)", "top"],
          ["Forwarder", "forwarder"],
        ].map(([label, key]) => (
          <input
            key={key}
            className="input"
            placeholder={label}
            type={key === "top" ? "number" : "text"}
            value={(form as any)[key]}
            onChange={(e) =>
              setForm({ ...form, [key]: e.target.value })
            }
          />
        ))}
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
              <th>Code</th>
              <th>Name</th>
              <th>Country</th>
              <th>PIC</th>
              <th>Email</th>
              <th>Category</th>
              <th>Currency</th>
              <th>Incoterm</th>
              <th>TOP</th>
              <th>Forwarder</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-4 text-gray-400">
                  No data
                </td>
              </tr>
            )}

            {data.map((row) => (
              <tr key={row.id}>
                <td>{row.supplier_code}</td>
                <td>{row.supplier_name}</td>
                <td>{row.country}</td>
                <td>{row.pic}</td>
                <td>{row.email}</td>
                <td>{row.category}</td>
                <td>{row.currency}</td>
                <td>{row.incoterm}</td>
                <td>{row.top}</td>
                <td>{row.forwarder}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
