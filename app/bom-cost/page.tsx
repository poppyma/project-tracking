"use client";

import { useEffect, useState } from "react";

/* ======================
   TYPES
====================== */
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

/* ======================
   PAGE
====================== */
export default function BomCostPage() {
  const [data, setData] = useState<BomCost[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [components, setComponents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

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

  /* ======================
     LOAD DATA
  ====================== */
  async function loadBomCost() {
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

  /* ======================
     SELECT ROW (EDIT)
  ====================== */
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

  /* ======================
     SUBMIT
  ====================== */
  async function submitForm(e: React.FormEvent) {
    e.preventDefault();

    const method = editingId ? "PUT" : "POST";
    const url = "/api/bom-cost";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        ...form,
        project_id: Number(form.project_id),
      }),
    });

    if (!res.ok) {
      showToast("Gagal menyimpan data", "error");
      return;
    }

    showToast(
      editingId ? "Data berhasil diupdate" : "Data berhasil ditambahkan",
      "success"
    );

    resetForm();
    loadBomCost();
  }

  function resetForm() {
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
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast((t) => ({ ...t, show: false })),
      3000
    );
  }

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="p-6 max-w-7xl">
      {/* TOAST */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white text-sm z-50
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
        className="grid grid-cols-3 gap-3 bg-white border p-4 rounded-xl mb-6"
      >
        <select
          value={form.project_id}
          onChange={(e) => {
            setForm({ ...form, project_id: e.target.value, component: "" });
            loadComponents(e.target.value);
          }}
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

        <input
          placeholder="Supplier"
          className="border px-3 py-2 rounded"
          value={form.candidate_supplier}
          onChange={(e) =>
            setForm({ ...form, candidate_supplier: e.target.value })
          }
        />

        <input
          placeholder="Price"
          className="border px-3 py-2 rounded"
          value={form.price}
          onChange={(e) =>
            setForm({ ...form, price: e.target.value })
          }
        />

        <input
          placeholder="Currency"
          className="border px-3 py-2 rounded"
          value={form.currency}
          onChange={(e) =>
            setForm({ ...form, currency: e.target.value })
          }
        />

        <input
          placeholder="Term"
          className="border px-3 py-2 rounded"
          value={form.term}
          onChange={(e) =>
            setForm({ ...form, term: e.target.value })
          }
        />

        <input
          placeholder="Landed Cost (%)"
          className="border px-3 py-2 rounded"
          value={form.landed_cost}
          onChange={(e) =>
            setForm({ ...form, landed_cost: e.target.value })
          }
        />

        <input
          placeholder="TPL (%)"
          className="border px-3 py-2 rounded"
          value={form.tpl}
          onChange={(e) =>
            setForm({ ...form, tpl: e.target.value })
          }
        />

        <input
          placeholder="Tooling Cost"
          className="border px-3 py-2 rounded"
          value={form.tooling_cost}
          onChange={(e) =>
            setForm({ ...form, tooling_cost: e.target.value })
          }
        />

        <div className="col-span-3 flex gap-2">
          <button className="bg-blue-600 text-white px-6 py-2 rounded">
            {editingId ? "Update" : "Save"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="border px-6 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-2">Project</th>
              <th className="border px-2 py-2">Component</th>
              <th className="border px-2 py-2">Supplier</th>
              <th className="border px-2 py-2">Price</th>
              <th className="border px-2 py-2">Currency</th>
              <th className="border px-2 py-2">Term</th>
              <th className="border px-2 py-2">Cost Bearing</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : (
              data.map((d) => (
                <tr
                  key={d.id}
                  title="Klik untuk edit"
                  onClick={() => selectRow(d)}
                  className={`cursor-pointer hover:bg-blue-50
                    ${editingId === d.id ? "bg-blue-100 ring-1 ring-blue-300" : ""}
                  `}
                >
                  <td className="border px-2 py-2">
                    {d.project_name || d.project_id}
                  </td>
                  <td className="border px-2 py-2">{d.component}</td>
                  <td className="border px-2 py-2">
                    {d.candidate_supplier}
                  </td>
                  <td className="border px-2 py-2">{d.price}</td>
                  <td className="border px-2 py-2">{d.currency}</td>
                  <td className="border px-2 py-2">{d.term}</td>
                  <td className="border px-2 py-2 font-semibold text-right">
                    {Number(d.cost_bearing).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
