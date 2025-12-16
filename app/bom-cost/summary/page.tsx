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
  const [projectId, setProjectId] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([]);
  const [cheapestMap, setCheapestMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // ======================
  // LOAD PROJECT LIST
  // ======================
  useEffect(() => {
    fetch("/api/projects/simple")
      .then((res) => res.json())
      .then(setProjects);
  }, []);

  // ======================
  // LOAD BOM SAAT PROJECT BERUBAH
  // ======================
  useEffect(() => {
    if (!projectId) {
      setRows([]);
      setCheapestMap({});
      return;
    }

    async function load() {
      setLoading(true);
      const res = await fetch(
        `/api/bom-summary?project_id=${projectId}`
      );
      const data: Row[] = await res.json();
      setRows(data);
      calculateCheapest(data);
      setLoading(false);
    }

    load();
  }, [projectId]);

  // ======================
  // HITUNG TERMURAH
  // ======================
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

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">BOM Summary</h1>

      {/* PROJECT DROPDOWN */}
      <select
        className="border px-3 py-2 mb-4"
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
      >
        <option value="">-- Pilih Project --</option>
        {projects.map((p) => (
          <option key={p.id} value={String(p.id)}>
            {p.name}
          </option>
        ))}
      </select>

      {/* TABLE SELALU MUNCUL */}
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2">Component</th>
            <th className="border px-2">Supplier</th>
            <th className="border px-2">Cost / Bearing</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={3}
                className="border px-2 text-center py-4"
              >
                Loading...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={3}
                className="border px-2 text-center text-gray-500 py-4"
              >
                Tidak ada data
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const isCheapest =
                Number(r.cost_bearing) ===
                cheapestMap[r.component];

              return (
                <tr
                  key={r.id}
                  className={
                    isCheapest
                      ? "bg-yellow-200 font-semibold"
                      : ""
                  }
                >
                  <td className="border px-2">
                    {r.component}
                  </td>
                  <td className="border px-2">
                    {r.candidate_supplier}
                  </td>
                  <td className="border px-2 text-right">
                    {Number(
                      r.cost_bearing
                    ).toLocaleString("id-ID")}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>

        <tfoot>
          <tr className="font-bold bg-yellow-300">
            <td colSpan={2} className="border px-2 text-right">
              TOTAL COST BEARING (TERMURAH)
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
