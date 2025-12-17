"use client";
import React, { useEffect, useState, useMemo } from "react";

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

// ======================
// Fungsi parseNumber dari string Supabase
// ======================
function parseNumber(value: string | null): number {
  if (!value) return 0;
  return Number(
    value
      .replace(/\./g, "")   // hapus titik ribuan
      .replace(",", ".")    // koma jadi desimal
      .replace("%", "")     // hapus %
      .trim()
  ) || 0;
}

export default function BomSummaryPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedSupplierMap, setSelectedSupplierMap] = useState<Record<string, string>>({});

  // ======================
  // LOAD PROJECT LIST
  // ======================
  useEffect(() => {
    fetch("/api/projects/simple")
      .then((res) => res.json())
      .then(setProjects)
      .catch(console.error);
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
        const res = await fetch(`/api/bom-cost-summary?project_id=${projectId}`, { cache: "no-store" });
        const data: Row[] = await res.json();
        console.log("API data landed/tpl:", data.map(r => ({
          component: r.component,
          landed: r.landed_cost_percent,
          tpl: r.tpl_percent
        })));
        setRows(data);

        // DEFAULT: PILIH SUPPLIER TERMURAH
        const defaultSelection: Record<string, string> = {};
        const groupedByComponent: Record<string, Row[]> = {};

        data.forEach((r) => {
          if (!groupedByComponent[r.component]) groupedByComponent[r.component] = [];
          groupedByComponent[r.component].push(r);
        });

        for (const comp in groupedByComponent) {
          const cheapest = groupedByComponent[comp].reduce((prev, curr) =>
            parseNumber(curr.cost_bearing) < parseNumber(prev.cost_bearing) ? curr : prev
          );
          defaultSelection[comp] = cheapest.candidate_supplier;
        }

        setSelectedSupplierMap(defaultSelection);
      } catch (err) {
        console.error(err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [projectId]);

  // ======================
  // HITUNG TOTAL COST SESUAI PILIHAN USER
  // ======================
  const totalCost = useMemo(() => {
    return rows.reduce((sum, r) => {
      if (selectedSupplierMap[r.component] === r.candidate_supplier) {
        return sum + parseNumber(r.cost_bearing);
      }
      return sum;
    }, 0);
  }, [rows, selectedSupplierMap]);

  // ======================
  // HANDLE PILIH SUPPLIER
  // ======================
  const handleSelectSupplier = (component: string, supplier: string) => {
    setSelectedSupplierMap((prev) => ({
      ...prev,
      [component]: supplier,
    }));
  };

  // ======================
  // GROUP ROWS PER COMPONENT
  // ======================
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
          <option key={p.id} value={String(p.id)}>
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
              <th className="border px-2">BP 2026</th>
              <th className="border px-2">Landed IDR</th>
              <th className="border px-2">Cost / Bearing</th>
              <th className="border px-2">Use for Total?</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="border text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="border text-center py-4 text-gray-500">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              Object.entries(groupedRows).map(([component, componentRows]) => (
                <React.Fragment key={component}>
                  {componentRows.map((r, i) => {
                    const isSelected = selectedSupplierMap[r.component] === r.candidate_supplier;
                    return (
                      <tr key={i} className={isSelected ? "bg-yellow-100 font-semibold" : ""}>
                        <td className="border px-2">{r.component}</td>
                        <td className="border px-2">{r.candidate_supplier}</td>
                        <td className="border px-2 text-right">{r.price ? parseNumber(r.price).toLocaleString("id-ID") : "-"}</td>
                        <td className="border px-2">{r.currency}</td>
                        <td className="border px-2">{r.term}</td>
                        <td className="border px-2 text-right">{r.landed_cost_percent ? parseNumber(r.landed_cost_percent) + "%" : "-"}</td>
                        <td className="border px-2 text-right">{r.tpl_percent ? parseNumber(r.tpl_percent) + "%" : "-"}</td>
                        <td className="border px-2 text-right">{r.bp_2026 ? parseNumber(r.bp_2026).toLocaleString("id-ID") : "-"}</td>
                        <td className="border px-2 text-right">{r.landed_idr_price ? parseNumber(r.landed_idr_price).toLocaleString("id-ID") : "-"}</td>
                        <td className="border px-2 text-right">{r.cost_bearing ? parseNumber(r.cost_bearing).toLocaleString("id-ID") : "-"}</td>
                        <td className="border px-2 text-center">
                          <input
                            type="radio"
                            name={`selected-${r.component}`}
                            checked={isSelected}
                            onChange={() => handleSelectSupplier(r.component, r.candidate_supplier)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {/* Spacer antar component */}
                  <tr>
                    <td colSpan={11} className="py-2"></td>
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
              <td className="border px-2 text-right">{totalCost.toLocaleString("id-ID")}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
