"use client";

import React, { useEffect, useMemo, useState } from "react";

type Project = {
  id: number;
  name: string;
};

type Row = {
  component: string;
  candidate_supplier: string;
  price: string | null;
  currency: string;
  term: string;
  landed_cost_percent: string | null;
  tpl_percent: string | null;
  bp_2026: string | null;
  landed_idr_price: string | null;
  cost_bearing: string | null;
};

/* ================= FORMATTERS ================= */

function parseNumber(value: string | null): number {
  if (!value) return 0;
  return (
    Number(
      value.replace(/\./g, "").replace(",", ".").replace("%", "")
    ) || 0
  );
}

function formatID(value: string | number | null) {
  if (value === null || value === undefined) return "-";

  const num =
    typeof value === "number"
      ? value
      : Number(value.replace(/\./g, "").replace(",", "."));

  if (isNaN(num)) return "-";

  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatPercent(value: string | null) {
  if (!value) return "-";
  const num = Number(value.replace("%", "").replace(",", "."));
  if (isNaN(num)) return "-";
  return `${num}%`;
}

/* ================= COMPONENT ================= */

export default function BomSummaryClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSupplierMap, setSelectedSupplierMap] =
    useState<Record<string, string>>({});

  /* LOAD PROJECT */
  useEffect(() => {
    fetch("/api/projects/simple")
      .then((r) => r.json())
      .then(setProjects);
  }, []);

  /* LOAD BOM SUMMARY */
  useEffect(() => {
    if (!projectId) return;

    async function load() {
      setLoading(true);
      const res = await fetch(
        `/api/bom-cost-summary?project_id=${projectId}`,
        { cache: "no-store" }
      );
      const data: Row[] = await res.json();
      setRows(data);

      const map: Record<string, string> = {};
      const grouped: Record<string, Row[]> = {};

      data.forEach((r) => {
        if (!grouped[r.component]) grouped[r.component] = [];
        grouped[r.component].push(r);
      });

      Object.entries(grouped).forEach(([comp, list]) => {
        const cheapest = list.reduce((a, b) =>
          parseNumber(b.cost_bearing) < parseNumber(a.cost_bearing) ? b : a
        );
        map[comp] = cheapest.candidate_supplier;
      });

      setSelectedSupplierMap(map);
      setLoading(false);
    }

    load();
  }, [projectId]);

  /* TOTAL COST */
  const totalCost = useMemo(() => {
    return rows.reduce((sum, r) => {
      if (selectedSupplierMap[r.component] === r.candidate_supplier) {
        return sum + parseNumber(r.cost_bearing);
      }
      return sum;
    }, 0);
  }, [rows, selectedSupplierMap]);

  /* GROUP */
  const groupedRows = useMemo(() => {
    return rows.reduce<Record<string, Row[]>>((acc, r) => {
      if (!acc[r.component]) acc[r.component] = [];
      acc[r.component].push(r);
      return acc;
    }, {});
  }, [rows]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">BOM Summary</h1>

      <select
        className="border px-3 py-2 mb-4"
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
      >
        <option value="">-- Pilih Project --</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <table className="w-full border text-xs">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2">Component</th>
            <th className="border px-2">Supplier</th>
            <th className="border px-2">Price</th>
            <th className="border px-2">Landed %</th>
            <th className="border px-2">TPL</th>
            <th className="border px-2">Landed IDR</th>
            <th className="border px-2">Cost Bearing</th>
            <th className="border px-2">Use</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="text-center py-4">
                Loading...
              </td>
            </tr>
          ) : (
            Object.entries(groupedRows).map(([comp, list]) =>
              list.map((r, i) => {
                const selected =
                  selectedSupplierMap[r.component] ===
                  r.candidate_supplier;

                return (
                  <tr
                    key={i}
                    className={selected ? "bg-yellow-100 font-semibold" : ""}
                  >
                    <td className="border px-2">{r.component}</td>
                    <td className="border px-2">
                      {r.candidate_supplier}
                    </td>
                    <td className="border px-2 text-right">
                      {formatID(r.price)}
                    </td>
                    <td className="border px-2 text-right">
                      {formatPercent(r.landed_cost_percent)}
                    </td>
                    <td className="border px-2 text-right">
                      {formatPercent(r.tpl_percent)}
                    </td>
                    <td className="border px-2 text-right">
                      {formatID(r.landed_idr_price)}
                    </td>
                    <td className="border px-2 text-right">
                      {formatID(r.cost_bearing)}
                    </td>
                    <td className="border px-2 text-center">
                      <input
                        type="radio"
                        checked={selected}
                        onChange={() =>
                          setSelectedSupplierMap((p) => ({
                            ...p,
                            [r.component]: r.candidate_supplier,
                          }))
                        }
                      />
                    </td>
                  </tr>
                );
              })
            )
          )}
        </tbody>

        <tfoot>
          <tr className="bg-yellow-300 font-bold">
            <td colSpan={6} className="border px-2 text-right">
              TOTAL COST BEARING
            </td>
            <td className="border px-2 text-right">
              {formatID(totalCost)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
