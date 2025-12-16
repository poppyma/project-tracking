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
  component: string;
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
  const [components, setComponents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    project_id: "",
    component: "",
    candidate_supplier: "",
    price: "",
    currency: "",
    term: "",
    landed_cost: "",
    tpl: "",
    tooling_cost: "",
  });

  // =============================
  // LOAD DATA
  // =============================
  async function loadBomCost() {
    setLoading(true);
    const res = await fetch("/api/bom-cost", { cache: "no-store" });
    setData(await res.json());
    setLoading(false);
  }

  async function loadProjects() {
    const res = await fetch("/api/projects/simple");
    setProjects(await res.json());
  }

  async function loadComponents(projectId: string) {
    if (!projectId) return setComponents([]);
    const res = await fetch(`/api/materials?project_id=${projectId}`);
    const json = await res.json();
    setComponents(json.map((m: any) => m.component));
  }

  useEffect(() => {
    loadBomCost();
    loadProjects();
  }, []);

  // =============================
  // SELECT ROW → EDIT
  // =============================
  function selectRow(row: BomCost) {
    setEditingId(row.id);
    setForm({
      project_id: String(row.project_id),
      component: row.component,
      candidate_supplier: row.candidate_supplier,
      price: row.price,
      currency: row.currency,
      term: row.term,
      landed_cost: row.landed_cost,
      tpl: row.tpl,
      tooling_cost: row.tooling_cost,
    });
    loadComponents(String(row.project_id));
  }

  // =============================
  // SUBMIT
  // =============================
  async function submitForm(e: React.FormEvent) {
    e.preventDefault();

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

    setEditingId(null);
    setForm({
      project_id: "",
      component: "",
      candidate_supplier: "",
      price: "",
      currency: "",
      term: "",
      landed_cost: "",
      tpl: "",
      tooling_cost: "",
    });

    loadBomCost();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">BOM Cost</h1>

      {/* FORM */}
      <form
        onSubmit={submitForm}
        className="grid grid-cols-3 gap-3 bg-white p-4 rounded-xl border"
      >
        <select
          value={form.project_id}
          onChange={(e) => {
            setForm({ ...form, project_id: e.target.value, component: "" });
            loadComponents(e.target.value);
          }}
          className="border px-3 py-2 rounded"
        >
          <option value="">-- Pilih Project --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={form.component}
          onChange={(e) => setForm({ ...form, component: e.target.value })}
          className="border px-3 py-2 rounded"
          required
        >
          <option value="">-- Pilih Component --</option>
          {components.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <input className="border px-3 py-2" placeholder="Supplier"
          value={form.candidate_supplier}
          onChange={(e) => setForm({ ...form, candidate_supplier: e.target.value })}
        />

        <input className="border px-3 py-2" placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />

        <input className="border px-3 py-2" placeholder="Currency"
          value={form.currency}
          onChange={(e) => setForm({ ...form, currency: e.target.value })}
        />

        <input className="border px-3 py-2" placeholder="Term"
          value={form.term}
          onChange={(e) => setForm({ ...form, term: e.target.value })}
        />

        <input className="border px-3 py-2" placeholder="Landed Cost (%)"
          value={form.landed_cost}
          onChange={(e) => setForm({ ...form, landed_cost: e.target.value })}
        />

        <input className="border px-3 py-2" placeholder="TPL (%)"
          value={form.tpl}
          onChange={(e) => setForm({ ...form, tpl: e.target.value })}
        />

        <input className="border px-3 py-2" placeholder="Tooling Cost"
          value={form.tooling_cost}
          onChange={(e) => setForm({ ...form, tooling_cost: e.target.value })}
        />

        <button className="bg-blue-600 text-white rounded px-4 py-2 col-span-3">
          {editingId ? "Update BOM Cost" : "Save BOM Cost"}
        </button>
      </form>

      {/* TABLE */}
<div className="bg-white border rounded-xl mt-6">
  <div className="overflow-x-auto">
    <table className="min-w-[1600px] w-full text-sm">
      <thead className="bg-gray-100 sticky top-0 z-10">
        <tr>
          <th className="border px-3 py-2">Project</th>
          <th className="border px-3 py-2">Component</th>
          <th className="border px-3 py-2">Supplier</th>
          <th className="border px-3 py-2">Price</th>
          <th className="border px-3 py-2">Currency</th>
          <th className="border px-3 py-2">Term</th>
          <th className="border px-3 py-2">Landed Cost (%)</th>
          <th className="border px-3 py-2">TPL (%)</th>
          <th className="border px-3 py-2">BP 2026</th>
          <th className="border px-3 py-2">Landed IDR</th>
          <th className="border px-3 py-2">Cost Bearing</th>
          <th className="border px-3 py-2">Tooling Cost</th>
        </tr>
      </thead>

      <tbody>
        {data.map((d) => (
          <tr key={d.id} className="hover:bg-blue-50">
            <td className="border px-3 py-2 whitespace-nowrap">{d.project_name}</td>
            <td className="border px-3 py-2 whitespace-nowrap">{d.component}</td>
            <td className="border px-3 py-2">{d.candidate_supplier}</td>
            <td className="border px-3 py-2 text-right">{d.price}</td>
            <td className="border px-3 py-2">{d.currency}</td>
            <td className="border px-3 py-2">{d.term}</td>
            <td className="border px-3 py-2 text-right">{d.landed_cost}%</td>
            <td className="border px-3 py-2 text-right">{d.tpl}%</td>
            <td className="border px-3 py-2 text-right">{d.bp_2026}</td>
            <td className="border px-3 py-2 text-right">
              {Number(d.landed_idr_price).toLocaleString("id-ID")}
            </td>
            <td className="border px-3 py-2 text-right font-semibold">
              {Number(d.cost_bearing).toLocaleString("id-ID")}
            </td>
            <td className="border px-3 py-2 text-right">
              {Number(d.tooling_cost).toLocaleString("id-ID")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

    </div>
  );
}
