"use client";

import { useEffect, useState } from "react";

type Project = { id: number; name: string };
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
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [form, setForm] = useState({
    id: 0,
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

  const [currencyInput, setCurrencyInput] = useState("");
  const [filteredCurrencies, setFilteredCurrencies] = useState<string[]>([]);

  // ================= LOAD DATA =================
  useEffect(() => {
    loadBomCost();
    loadProjects();
    loadCurrencies();
  }, []);

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

  async function loadCurrencies() {
    try {
      const res = await fetch("/api/bp");
      const json = await res.json();
      setCurrencies(json.map((c: any) => c.currency));
    } catch (err) {
      console.error("Gagal load currencies:", err);
    }
  }

  // ================= EDIT =================
  function selectRow(row: BomCost) {
    setEditingId(row.id);
    setForm({
      id: row.id,
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
    setCurrencyInput(row.currency);
    loadComponents(String(row.project_id));
  }

  // ================= SUBMIT =================
  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/bom-cost` : `/api/bom-cost`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, project_id: Number(form.project_id) }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan BOM Cost");

      setEditingId(null);
      setForm({
        id: 0,
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
      setCurrencyInput("");
      await loadBomCost();

      setToast({
        message: editingId ? "BOM Cost berhasil diupdate!" : "BOM Cost berhasil disimpan!",
        type: "success",
      });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast({ message: err.message || "Terjadi kesalahan", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  // ================= DELETE =================
  async function deleteRow(id: number) {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      const res = await fetch("/api/bom-cost", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Gagal menghapus data");
      await loadBomCost();
      setToast({ message: "Data berhasil dihapus", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast({ message: err.message || "Terjadi kesalahan", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  }

  // ================= AUTOCOMPLETE =================
  const handleCurrencyInput = (val: string) => {
    const upper = val.toUpperCase();
    setCurrencyInput(upper);
    setForm({ ...form, currency: upper });
    setFilteredCurrencies(currencies.filter((c) => c.includes(upper) && upper !== ""));
  };

  return (
    <div className="space-y-6 relative min-h-screen">

      {/* TOAST */}
      <div className="fixed top-4 right-4 z-[9999]">
        {toast && (
          <div
            className={`px-4 py-2 rounded shadow text-white font-semibold transform transition-transform duration-300 ${
              toast.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>

      <h1 className="text-2xl font-bold">BOM Cost</h1>

      {/* FORM */}
      <form onSubmit={submitForm} className="grid grid-cols-3 gap-3 bg-white p-4 rounded-xl border relative">
        {submitting && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl z-10">
            <span className="text-blue-600 font-semibold animate-pulse">Saving...</span>
          </div>
        )}

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
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={form.component}
          onChange={(e) => setForm({ ...form, component: e.target.value })}
          className="border px-3 py-2 rounded"
        >
          <option value="">-- Pilih Component --</option>
          {components.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <input
          className="border px-3 py-2"
          placeholder="Supplier"
          value={form.candidate_supplier}
          onChange={(e) => setForm({ ...form, candidate_supplier: e.target.value })}
        />

        <input
          className="border px-3 py-2"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />

        {/* Autocomplete Currency */}
        <div className="relative">
          <input
            type="text"
            className="border px-3 py-2 rounded w-full"
            placeholder="Currency"
            value={currencyInput}
            onChange={(e) => handleCurrencyInput(e.target.value)}
          />
          {filteredCurrencies.length > 0 && (
            <ul className="border rounded bg-white absolute z-10 mt-1 max-h-40 overflow-auto w-full">
              {filteredCurrencies.map((c) => (
                <li
                  key={c}
                  className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setCurrencyInput(c);
                    setForm({ ...form, currency: c });
                    setFilteredCurrencies([]);
                  }}
                >
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>

        <input
          className="border px-3 py-2"
          placeholder="Term"
          value={form.term}
          onChange={(e) => setForm({ ...form, term: e.target.value })}
        />

        <input
          className="border px-3 py-2"
          placeholder="Landed Cost (%)"
          value={form.landed_cost}
          onChange={(e) => setForm({ ...form, landed_cost: e.target.value })}
        />

        <input
          className="border px-3 py-2"
          placeholder="TPL (%)"
          value={form.tpl}
          onChange={(e) => setForm({ ...form, tpl: e.target.value })}
        />

        <input
          className="border px-3 py-2"
          placeholder="Tooling Cost"
          value={form.tooling_cost}
          onChange={(e) => setForm({ ...form, tooling_cost: e.target.value })}
        />

        {/* SUBMIT & CANCEL BUTTON */}
        <div className="col-span-3 flex gap-2 mt-2">
          <button
            type="submit"
            className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50 flex-1"
            disabled={submitting}
          >
            {editingId ? "Update BOM Cost" : "Save BOM Cost"}
          </button>

          {editingId && (
            <button
              type="button"
              className="bg-gray-300 text-gray-800 rounded px-4 py-2 flex-1"
              onClick={() => {
                setEditingId(null);
                setForm({
                  id: 0,
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
                setCurrencyInput("");
              }}
              disabled={submitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1700px] text-sm">
            <thead className="bg-gray-100">
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
                <th className="border px-3 py-2">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} className="text-center py-6">Loading...</td>
                </tr>
              ) : (
                data.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => selectRow(d)}
                    title="Klik untuk edit"
                    className={`cursor-pointer hover:bg-blue-50 ${editingId === d.id ? "bg-blue-100 ring-1 ring-blue-300" : ""}`}
                  >
                    <td className="border px-3 py-2">{d.project_name}</td>
                    <td className="border px-3 py-2">{d.component}</td>
                    <td className="border px-3 py-2">{d.candidate_supplier}</td>
                    <td className="border px-3 py-2 text-right">{d.price}</td>
                    <td className="border px-3 py-2">{d.currency}</td>
                    <td className="border px-3 py-2">{d.term}</td>
                    <td className="border px-3 py-2 text-right">{d.landed_cost}%</td>
                    <td className="border px-3 py-2 text-right">{d.tpl}%</td>
                    <td className="border px-3 py-2 text-right">{d.bp_2026}</td>
                    <td className="border px-3 py-2 text-right">{Number(d.landed_idr_price).toLocaleString("id-ID")}</td>
                    <td className="border px-3 py-2 text-right font-semibold">{Number(d.cost_bearing).toLocaleString("id-ID")}</td>
                    <td className="border px-3 py-2 text-right">{Number(d.tooling_cost).toLocaleString("id-ID")}</td>
                    <td className="border px-3 py-2 text-center">
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRow(d.id);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
