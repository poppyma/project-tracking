"use client";

import { useEffect, useState } from "react";

type IPD = {
  id: string;
  ipd_siis: string;
  description: string;
  fb_type: string;
  commodity: string;
  ipd_quotation: number;
};

export default function InputIPD() {
  const [list, setList] = useState<IPD[]>([]);
  const [form, setForm] = useState({
    ipd_siis: "",
    description: "",
    fb_type: "",
    commodity: "",
    ipd_quotation: "",
  });

  async function loadData() {
    const res = await fetch("/api/ipd");
    const data = await res.json();
    setList(data);
  }

  useEffect(() => {
    loadData();
  }, []);
  async function handleSubmit() {
    if (!form.ipd_siis) {
      alert("IPD SIIS wajib diisi");
      return;
    }

    const res = await fetch("/api/ipd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        ipd_quotation: Number(form.ipd_quotation),
      }),
    });

    if (!res.ok) {
      alert("Gagal menyimpan data");
      return;
    }

    setForm({
      ipd_siis: "",
      description: "",
      fb_type: "",
      commodity: "",
      ipd_quotation: "",
    });

    loadData();
  }
  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">Input IPD</h1>

      <div className="grid grid-cols-5 gap-4">
        <input
          placeholder="IPD SIIS"
          value={form.ipd_siis}
          onChange={(e) => setForm({ ...form, ipd_siis: e.target.value })}
          className="input"
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input"
        />
        <input
          placeholder="FB Type"
          value={form.fb_type}
          onChange={(e) => setForm({ ...form, fb_type: e.target.value })}
          className="input"
        />
        <input
          placeholder="Commodity"
          value={form.commodity}
          onChange={(e) => setForm({ ...form, commodity: e.target.value })}
          className="input"
        />
        <input
          placeholder="IPD Quotation"
          type="number"
          value={form.ipd_quotation}
          onChange={(e) =>
            setForm({ ...form, ipd_quotation: e.target.value })
          }
          className="input"
        />
      </div>

      <button onClick={handleSubmit} className="btn">
        Save
      </button>
      <table className="w-full border mt-6">
        <thead>
          <tr className="bg-gray-100">
            <th>IPD SIIS</th>
            <th>Description</th>
            <th>FB Type</th>
            <th>Commodity</th>
            <th>IPD Quotation</th>
          </tr>
        </thead>

        <tbody>
          {list.map((row) => (
            <tr key={row.id} className="border-t">
              <td>{row.ipd_siis}</td>
              <td>{row.description}</td>
              <td>{row.fb_type}</td>
              <td>{row.commodity}</td>
              <td>{row.ipd_quotation}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
