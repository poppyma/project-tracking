"use client";

import { useEffect, useState } from "react";

type Project = {
  id: number;
  name: string;
};

type BomCost = {
  id: number;
  project_id: number;
  project_name?: string;
  candidate_supplier: string;
  price: string;
  currency: string;
  term: string;
  landed_cost: string;
  tpl: string;
  bp_2026: string;
  landed_idr_price: string;
  cost_bearing: string;
  tooling_cost: string;
};

export default function BomCostPage() {
  const [data, setData] = useState<BomCost[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    project_id: "",
    candidate_supplier: "",
    price: "",
    currency: "",
    term: "",
    landed_cost: "",
    tpl: "",
    bp_2026: "",
    landed_idr_price: "",
    cost_bearing: "",
    tooling_cost: "",
  });

  // =============================
  // LOAD DATA
  // =============================
  async function loadBomCost() {
    const res = await fetch("/api/bom-cost");
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  async function loadProjects() {
    const res = await fetch("/api/projects/simple");
    const json = await res.json();
    setProjects(json);
  }

  useEffect(() => {
    loadBomCost();
    loadProjects();
  }, []);

  // =============================
  // SUBMIT
  // =============================
  async function submitForm(e: React.FormEvent) {
    e.preventDefault();

    if (!form.project_id) {
      alert("Pilih project terlebih dahulu");
      return;
    }

    const res = await fetch("/api/bom-cost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        project_id: Number(form.project_id),
      }),
    });

    if (!res.ok) {
      alert("Gagal menyimpan BOM Cost");
      return;
    }

    setForm({
      project_id: "",
      candidate_supplier: "",
      price: "",
      currency: "",
      term: "",
      landed_cost: "",
      tpl: "",
      bp_2026: "",
      landed_idr_price: "",
      cost_bearing: "",
      tooling_cost: "",
    });

    loadBomCost();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">BOM Cost</h1>

      {/* FORM */}
      <form onSubmit={submitForm} className="grid grid-cols-3 gap-3 mb-6">

        {/* PROJECT DROPDOWN */}
        <select
          value={form.project_id}
          onChange={(e) =>
            setForm({ ...form, project_id: e.target.value })
          }
          className="border px-3 py-2 rounded"
          required
        >
          <option value="">-- Pilih Project --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <input placeholder="Candidate Supplier" value={form.candidate_supplier}
          onChange={e => setForm({ ...form, candidate_supplier: e.target.value })} />

        <input placeholder="Price" value={form.price}
          onChange={e => setForm({ ...form, price: e.target.value })} />

        <input placeholder="Currency" value={form.currency}
          onChange={e => setForm({ ...form, currency: e.target.value })} />

        <input placeholder="Term" value={form.term}
          onChange={e => setForm({ ...form, term: e.target.value })} />

        <input placeholder="Landed Cost" value={form.landed_cost}
          onChange={e => setForm({ ...form, landed_cost: e.target.value })} />

        <input placeholder="TPL" value={form.tpl}
          onChange={e => setForm({ ...form, tpl: e.target.value })} />

        <input placeholder="BP 2026" value={form.bp_2026}
          onChange={e => setForm({ ...form, bp_2026: e.target.value })} />

        <input placeholder="Landed IDR Price" value={form.landed_idr_price}
          onChange={e => setForm({ ...form, landed_idr_price: e.target.value })} />

        <input placeholder="Cost Bearing" value={form.cost_bearing}
          onChange={e => setForm({ ...form, cost_bearing: e.target.value })} />

        <input placeholder="Tooling Cost" value={form.tooling_cost}
          onChange={e => setForm({ ...form, tooling_cost: e.target.value })} />

        <button className="bg-blue-600 text-white px-4 py-2 rounded col-span-3">
          Save BOM Cost
        </button>
      </form>

      {/* TABLE */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2">Project</th>
              <th className="border px-2">Supplier</th>
              <th className="border px-2">Price</th>
              <th className="border px-2">Currency</th>
              <th className="border px-2">Term</th>
              <th className="border px-2">Landed Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.id}>
                <td className="border px-2">{d.project_name || d.project_id}</td>
                <td className="border px-2">{d.candidate_supplier}</td>
                <td className="border px-2">{d.price}</td>
                <td className="border px-2">{d.currency}</td>
                <td className="border px-2">{d.term}</td>
                <td className="border px-2">{d.landed_cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
