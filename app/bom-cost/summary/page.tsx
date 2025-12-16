"use client";

import { useEffect, useState } from "react";

type Project = {
  id: number;
  name: string;
};

type Row = {
  id: number;
  component: string;
  candidate_supplier: string;
  cost_bearing: string;
};

export default function BomSummaryPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [cheapestMap, setCheapestMap] = useState<Record<string, number>>({});

  /* =====================
     LOAD PROJECT
  ====================== */
  async function loadProjects() {
    const res = await fetch("/api/projects/simple");
    const json = await res.json();
    setProjects(json);
  }

  /* =====================
     LOAD SUMMARY
  ====================== */
  async function loadSummary(pid: string) {
    if (!pid) return;

    const res = await fetch(`/api/bom-summary?project_id=${pid}`);
    const data = await res.json();
    setRows(data);
    calculateCheapest(data);
  }

  function calculateCheapest(data: Row[]) {
    const map: Record<string, number> = {};

    data.forEach((row) => {
      const cost = Number(row.cost_bearing);
      if (!map[row.component] || cost < map[row.component]) {
        map[row.component] = cost;
      }
    });

    setCheapestMap(map);
  }

  const totalCheapest = Object.values(cheapestMap).reduce(
    (a, b) => a + b,
    0
  );

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">BOM Summary</h1>

      {/* PILIH PROJECT */}
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

      {/* TABLE */}
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2">Component</th>
            <th className="border px-2">Candidate Supplier</th>
            <th className="border px-2">Cost/Bearing</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => {
            const isCheapest =
              Number(r.cost_bearing) === cheapestMap[r.component];

            return (
              <tr key={r.id} className={isCheapest ? "bg-yellow-200" : ""}>
                <td className="border px-2">{r.component}</td>
                <td className="border px-2">{r.candidate_supplier}</td>
                <td className="border px-2 text-right">
                  {Number(r.cost_bearing).toLocaleString("id-ID")}
                </td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr className="font-bold bg-yellow-300">
            <td colSpan={2} className="border px-2 text-right">
              TOTAL COST/Bearing (Termurah)
            </td>
            <td className="border px-2 text-right">
              {totalCheapest.toLocaleString("id-ID")}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
