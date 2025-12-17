"use client";

import React, { useEffect, useMemo, useState } from "react";

/* ================= TYPES ================= */
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

/* ================= HELPERS ================= */

// Parsing AMAN (TIDAK dikali 100)
function parseNumber(value: string | null): number {
  if (!value) return 0;
  return Number(
    value
      .replace(/\./g, "")
      .replace(",", ".")
      .replace("%", "")
      .trim()
  ) || 0;
}

// 1202.60 -> 1202.6 | 1202.00 -> 1202
function formatTrimDecimal(value: string | null) {
  if (!value) return "-";
  const num = Number(value.replace(",", "."));
  if (isNaN(num)) return value;
  return num.toString().replace(".", ",");
}

// 10 -> 10% | 7.5 -> 7.5%
function formatPercent(value: string | null) {
  if (!value) return "-";
  const num = Number(value.replace("%", "").replace(",", "."));
  if (isNaN(num)) return value;
  return num.toString().replace(".", ",") + "%";
}

/* ================= COMPONENT ================= */
export default function BomSummaryClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedSupplierMap, setSelectedSupplierMap] =
    useState<Record<string, string>>({});

  /* ===== LOAD PROJECTS ===== */
  useEffect(() => {
    fetch("/api/projects/simple")
      .then((r) => r.json())
      .then(setProjects)
      .catch(console.error);
  }, []);

  /* ===== LOAD BOM SUMMARY ===== */
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
        const data: Row[] = await res.json();
        setRows(data);

        // default pilih supplier termurah per component
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
      } catch (e) {
        console.error(e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [projectId]);

  /* ===== TOTAL COST ===== */
  const totalCost = useMemo(() => {
    return rows.reduce((sum, r) => {
      if (selectedSupplierMap[r.component] === r.candidate_supplier) {
        return sum + parseNumber(r.cost_bearing);
      }
      return sum;
    }, 0);
  }, [rows, selectedSupplierMap]);

  /* ===== GROUP PER COMPONENT ===== */
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

      {/* PROJECT SELECT */}
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

      {/* TABLE */}
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
              <th className="border px-2">BP</th>
              <th className="border px-2">Landed IDR</th>
              <th className="border px-2">Cost Bearing</th>
              <th className="border px-2">Use</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-4 text-gray-500">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              Object.entries(groupedRows).map(([component, list]) => (
                <React.Fragment key={component}>
                  {list.map((r, i) => {
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
                          {formatTrimDecimal(r.price)}
                        </td>
                        <td className="border px-2">{r.currency}</td>
                        <td className="border px-2">{r.term}</td>
                        <td className="border px-2 text-right">
                          {formatPercent(r.landed_cost_percent)}
                        </td>
                        <td className="border px-2 text-right">
                          {formatPercent(r.tpl_percent)}
                        </td>
                        <td className="border px-2 text-right">
                          {formatTrimDecimal(r.bp_2026)}
                        </td>
                        <td className="border px-2 text-right">
                          {formatTrimDecimal(r.landed_idr_price)}
                        </td>
                        <td className="border px-2 text-right">
                          {formatTrimDecimal(r.cost_bearing)}
                        </td>
                        <td className="border px-2 text-center">
                          <input
                            type="radio"
                            name={`pick-${r.component}`}
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
                  })}
                  <tr>
                    <td colSpan={11} className="py-2" />
                  </tr>
                </React.Fragment>
              ))
            )}
          </tbody>

          <tfoot>
            <tr className="bg-yellow-300 font-bold">
              <td colSpan={10} className="border px-2 text-right">
                TOTAL COST BEARING
              </td>
              <td className="border px-2 text-right">
                {totalCost.toString().replace(".", ",")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
