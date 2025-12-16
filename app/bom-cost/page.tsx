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

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

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

  /* ================= LOAD DATA ================= */
  async function loadBomCost() {
    const res = await fetch("/api/bom-cost");
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  async function loadProjects() {
    const res = await fetch("/api/projects/simple");
    setProjects(await res.json());
  }

  async function loadComponents(projectId: string) {
    if (!projectId) {
      setComponents([]);
      return;
    }
    const res = await fetch(`/api/materials?project_id=${projectId}`);
    const json = await res.json();
    setComponents(json.map((m: any) => m.component));
  }

  useEffect(() => {
    loadBomCost();
    loadProjects();
  }, []);

  /* ================= SUBMIT ================= */
  async function submitForm(e: React.FormEvent) {
    e.preventDefault();

    if (!form.project_id) {
      showToast("Pilih project terlebih dahulu", "error");
      return;
    }

    try {
      const res = await fetch("/api/bom-cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          project_id: Number(form.project_id),
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan BOM Cost");
      }

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

      await loadBomCost();

      showToast("BOM Cost berhasil ditambahkan", "success");

    } catch (err: any) {
      showToast(err.message, "error");
    }
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
    }, 3000);
  }

  return (
    <div className="p-6">

      {/* TOAST */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm
            ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}
          `}
        >
          {toast.message}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">BOM Cost</h1>

      {/* FORM */}
      <form
        onSubmit={submitForm}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        <select
          value={form.project_id}
          onChange={(e) => {
            const value = e.target.value;
            setForm({ ...form, project_id: value, component: "" });
            loadComponents(value);
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
          onChange={(e) =>
            setForm({ ...form, component: e.target.value })
          }
          className="border px-3 py-2 rounded"
          required
        >
          <option value="">-- Pilih Component --</option>
          {components.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input className="border px-3 py-2" placeholder="Candidate Supplier"
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
              <th className="border px-2">Component</th>
              <th className="border px-2">Supplier</th>
              <th className="border px-2">Price</th>
              <th className="border px-2">Currency</th>
              <th className="border px-2">Term</th>
              <th className="border px-2">Landed Cost</th>
              <th className="border px-2">TPL</th>
              <th className="border px-2">BP 2026</th>
              <th className="border px-2">Landed IDR</th>
              <th className="border px-2">Cost Bearing</th>
              <th className="border px-2">Tooling Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.id}>
                <td className="border px-2">{d.project_name || d.project_id}</td>
                <td className="border px-2">{d.component}</td>
                <td className="border px-2">{d.candidate_supplier}</td>
                <td className="border px-2">{d.price}</td>
                <td className="border px-2">{d.currency}</td>
                <td className="border px-2">{d.term}</td>
                <td className="border px-2">{d.landed_cost}</td>
                <td className="border px-2">{d.tpl}</td>
                <td className="border px-2">{d.bp_2026}</td>
                <td className="border px-2 text-right">
                  {Number(d.landed_idr_price).toLocaleString("id-ID")}
                </td>
                <td className="border px-2 text-right font-semibold">
                  {Number(d.cost_bearing).toLocaleString("id-ID")}
                </td>
                <td className="border px-2">{d.tooling_cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
