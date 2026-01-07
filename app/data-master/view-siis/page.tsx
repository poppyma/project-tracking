"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= TYPES ================= */
type Supplier = {
  id: string;
  supplier_code: string;
  supplier_name: string;
  address: string;
  currency: string;
  incoterm: string;
  top: number;
};

type Row = {
  ipd_quotation: string;
  ipd: string | null;
  material_source: string | null;
  quarter: string;
  price: string;
};

/* ================= STORAGE KEY ================= */
const STORAGE_KEY = "view_siis_supplier_state";

/* ================= MONTHS ================= */
const MONTHS = [
  "JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE",
  "JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER",
];

/* ================= QUARTER → MONTH MAP ================= */
const QUARTER_MONTH_MAP: Record<string, number[]> = {
  Q1: [0, 1, 2],
  Q2: [3, 4, 5],
  Q3: [6, 7, 8],
  Q4: [9, 10, 11],
};

export default function ViewSIISPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");

  /* ================= LOAD SUPPLIERS ================= */
  useEffect(() => {
    fetch("/api/supplier")
      .then((r) => r.json())
      .then(setSuppliers)
      .catch(console.error);
  }, []);

  /* ================= RESTORE SUPPLIER ================= */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed?.supplier) setSupplier(parsed.supplier);
    } catch {}
  }, []);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    if (!supplier?.id) return;
    fetchSIISData(supplier.id);
  }, [supplier?.id]);

  /* ================= SAVE STATE ================= */
  useEffect(() => {
    if (!supplier) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ supplier })
    );
  }, [supplier]);

  async function fetchSIISData(supplierId: string) {
    try {
      const res = await fetch(
        `/api/siis?supplier_id=${supplierId}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      const data: Row[] = Array.isArray(json) ? json : [];
      setRows(data);

      const qs = Array.from(new Set(data.map((r) => r.quarter)));
      setSelectedQuarter(qs.length === 1 ? qs[0] : "");
    } catch {
      setRows([]);
    }
  }

  /* ================= UNIQUE QUARTERS ================= */
  const quarters = useMemo(
    () => Array.from(new Set(rows.map((r) => r.quarter))),
    [rows]
  );

  /* ================= FILTER BY QUARTER ================= */
  const filteredRows = useMemo(() => {
    if (!selectedQuarter) return rows;
    return rows.filter((r) => r.quarter === selectedQuarter);
  }, [rows, selectedQuarter]);

  /* ================= GROUP BY IPD (KEY = ipd_quotation) ================= */
  const ipds = useMemo(
    () =>
      Array.from(
        new Map(
          filteredRows
            .filter(
              r =>
                r.ipd &&
                r.ipd.trim() !== "" &&
                r.ipd !== "-"
            )
            .map((r) => [
              r.ipd_quotation,
              {
                ipd_quotation: r.ipd_quotation,
                ipd: r.ipd as string,
                material_source: r.material_source || "-",
              },
            ])
        ).values()
      ),
    [filteredRows]
  );

  function formatPrice(v: number) {
    return v === 0 ? "-" : v.toFixed(4);
  }

  /* ================= GET MONTH PRICE ================= */
  function getMonthPrice(ipdQuotation: string, monthIndex: number) {
    for (const r of filteredRows) {
      const q = r.quarter.split("-")[0];
      const months = QUARTER_MONTH_MAP[q];
      if (!months) continue;

      if (
        months.includes(monthIndex) &&
        r.ipd_quotation === ipdQuotation
      ) {
        return Number(r.price || 0);
      }
    }
    return 0;
  }

  /* ================= DOWNLOAD EXCEL ================= */
  function downloadExcel() {
    if (!supplier || !selectedQuarter) return;

    const header = [
      "IPD",
      "Material Source",
      ...MONTHS,
    ];

    const data = ipds.map((i) => [
      i.ipd,
      i.material_source,
      ...MONTHS.map((_, mIdx) =>
      formatPrice(getMonthPrice(i.ipd_quotation, mIdx))
      ),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SIIS");

    XLSX.writeFile(
      wb,
      `SIIS_${supplier.supplier_code}_${selectedQuarter}.xlsx`
    );
  }

  /* ================= DOWNLOAD PDF ================= */
  function downloadPDF() {
    if (!supplier || !selectedQuarter) return;

    const doc = new jsPDF("l", "mm", "a4");

    doc.setFontSize(12);
    doc.text(
      `SIIS PRICE - ${supplier.supplier_name}`,
      14,
      10
    );
    doc.setFontSize(10);
    doc.text(`Quarter: ${selectedQuarter}`, 14, 16);

    const tableColumn = [
      "IPD",
      "Material Source",
      ...MONTHS,
    ];

    const tableRows = ipds.map((i) => [
      i.ipd,
      i.material_source,
      ...MONTHS.map((_, mIdx) =>
        formatPrice(
          getMonthPrice(i.ipd_quotation, mIdx)
        )
      ),
    ]);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 22,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [200, 200, 200] },
    });

    doc.save(
      `SIIS_${supplier.supplier_code}_${selectedQuarter}.pdf`
    );
  }

  return (
    <div className="p-4 text-xs space-y-4">
      <h1 className="text-2xl font-bold">
        View Update Price SIIS
      </h1>

      {/* SELECT SUPPLIER */}
      <select
        className="border px-2 py-1"
        value={supplier?.id || ""}
        onChange={(e) => {
          const s = suppliers.find(
            (x) => x.id === e.target.value
          );
          if (s) setSupplier(s);
        }}
      >
        <option value="">-- Select Supplier --</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.supplier_code} - {s.supplier_name}
          </option>
        ))}
      </select>

      {/* SUPPLIER DETAIL */}
      {supplier && (
        <div className="border p-2 bg-gray-50 space-y-1">
          <div>SUPPLIER: {supplier.supplier_name}</div>
          <div>ADDRESS: {supplier.address}</div>
          <div>CURRENCY: {supplier.currency}</div>
          <div>INCOTERMS: {supplier.incoterm}</div>
          <div>TERMS OF PAYMENT: {supplier.top}</div>

          <div className="flex items-center gap-2">
            <span>PRICE VALIDITY:</span>
            {quarters.length <= 1 ? (
              <strong>{quarters[0]}</strong>
            ) : (
              <select
                className="border px-2 py-0.5"
                value={selectedQuarter}
                onChange={(e) =>
                  setSelectedQuarter(e.target.value)
                }
              >
                <option value="">-- Select Quarter --</option>
                {quarters.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* DOWNLOAD BUTTONS */}
          {selectedQuarter && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={downloadExcel}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Download Excel
              </button>
              <button
                onClick={downloadPDF}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Download PDF
              </button>
            </div>
          )}
        </div>
      )}

      {/* TABLE */}
      {supplier && selectedQuarter && (
        <div className="overflow-x-auto">
          <table className="border w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-2">No</th>
                <th className="border px-2">IPD</th>
                <th className="border px-2">Steel Supplier</th>
                {MONTHS.map((m) => (
                  <th key={m} className="border px-2">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {ipds.map((i, idx) => (
                <tr key={i.ipd_quotation}>
                  <td className="border px-2 text-center">
                    {idx + 1}
                  </td>
                  <td className="border px-2">{i.ipd}</td>
                  <td className="border px-2">{i.material_source}</td>

                  {MONTHS.map((_, mIdx) => (
                    <td
                      key={mIdx}
                      className="border px-2 text-right"
                    >
                      {formatPrice(
                        getMonthPrice(i.ipd_quotation, mIdx)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
