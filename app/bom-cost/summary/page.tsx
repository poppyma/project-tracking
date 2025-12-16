"use client";

import { useEffect, useState } from "react";

type Project = {
  id: number;
  name: string;
};

type Row = {
  component: string;
  candidate_supplier: string;
  price: number;
  currency: string;
  term: string;
  landed_cost_percent: number;
  tpl_percent: number;
  bp_2026: number;
  landed_idr_price: number;
  cost_bearing: number;
};

export default function BomSummaryPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
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
  // LOAD BOM DATA
  // ======================
  useEffect(() => {
    if (!projectId) {
      setRows([]);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/bom-cost-summary?project_id=${projectId}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        setRows(data);
      } catch (err) {
        console.error(err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [projectId]);

  const totalCost = rows.reduce(
    (sum, r) => sum + Number(r.cost_bearing),
    0
  );

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">BOM Summary</h1>

      {/* PROJECT SELECT */}
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

      {/* TABLE (SELALU MUNCUL) */}
      <div className="overflow-x-auto">
        <table className="w-full border text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2">Component</th>
              <th className="border px-2">Supplier</th>
              <th className="border px-2">Price</th>
              <th className="border px-2">Currency</th>
              <th className="border px-2">Term</th>
              <th className="border px-2">Landed %</th>
              <th className="border px-2">TPL</th>
              <th className="border px-2">BP 2026</th>
              <th className="border px-2">Landed IDR</th>
              <th className="border px-2">Cost / Bearing</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={10}
                  className="border text-center py-4"
                >
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="border text-center py-4 text-gray-500"
                >
                  Tidak ada data
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i}>
                  <td className="border px-2">
                    {r.component}
                  </td>
                  <td className="border px-2">
                    {r.candidate_supplier}
                  </td>
                  <td className="border px-2 text-right">
                    {r.price}
                  </td>
                  <td className="border px-2">
                    {r.currency}
                  </td>
                  <td className="border px-2">
                    {r.term}
                  </td>
                  <td className="border px-2 text-right">
                    {r.landed_cost_percent}%
                  </td>
                  <td className="border px-2 text-right">
                    {r.tpl_percent}%
                  </td>
                  <td className="border px-2 text-right">
                    {r.bp_2026.toLocaleString("id-ID")}
                  </td>
                  <td className="border px-2 text-right">
                    {r.landed_idr_price.toLocaleString(
                      "id-ID"
                    )}
                  </td>
                  <td className="border px-2 text-right">
                    {r.cost_bearing.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* TOTAL */}
          <tfoot>
            <tr className="bg-yellow-300 font-bold">
              <td
                colSpan={9}
                className="border px-2 text-right"
              >
                TOTAL COST BEARING
              </td>
              <td className="border px-2 text-right">
                {totalCost.toLocaleString("id-ID")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
