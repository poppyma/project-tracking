"use client";

import { useEffect, useState } from "react";

type Project = {
  id: number;
  name: string;
};

type ComponentCost = {
  component: string;
  min_cost: number;
};

export default function BomCostSummaryPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [rows, setRows] = useState<ComponentCost[]>([]);
  const [total, setTotal] = useState(0);

  async function loadProjects() {
    const res = await fetch("/api/projects/simple");
    setProjects(await res.json());
  }

  async function loadSummary(pid: string) {
    const res = await fetch(`/api/bom-cost-summary?project_id=${pid}`);
    const json = await res.json();
    setRows(json.components);
    setTotal(json.total_cost);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        BOM Cost Summary
      </h1>

      {/* Project Picker */}
      <select
        className="border px-3 py-2 mb-4 rounded"
        value={projectId}
        onChange={(e) => {
          setProjectId(e.target.value);
          loadSummary(e.target.value);
        }}
      >
        <option value="">-- Pilih Project --</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Table */}
      {rows.length > 0 && (
        <table className="border w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Component</th>
              <th className="border px-2 py-1 text-right">
                Cheapest Cost (IDR)
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.component}>
                <td className="border px-2">{r.component}</td>
                <td className="border px-2 text-right">
                  {Number(r.min_cost).toLocaleString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* TOTAL */}
      {rows.length > 0 && (
        <div className="mt-4 text-right font-bold text-lg bg-yellow-300 p-3">
          Total Cost/Bearing:{" "}
          {Number(total).toLocaleString("id-ID")}
        </div>
      )}
    </div>
  );
}
