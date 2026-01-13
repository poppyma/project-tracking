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

type Approval = {
  title: string;
  name: string;
};

/* ================= MONTHS ================= */
const MONTHS = [
  "JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE",
  "JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER",
];

const QUARTER_MONTH_MAP: Record<string, number[]> = {
  Q1: [0,1,2],
  Q2: [3,4,5],
  Q3: [6,7,8],
  Q4: [9,10,11],
};

export default function ViewSIISPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState("");

  /* ===== APPROVAL STATE ===== */
  const [approvals, setApprovals] = useState<Approval[]>([
    { title: "Factory Manager", name: "Mohammad Saddiq" },
    { title: "Finance Controller", name: "Dwi Ari Nuryasini" },
    { title: "Purchasing Manager", name: "Mochris Lestari" },
  ]);

  /* ================= LOAD SUPPLIER ================= */
  useEffect(() => {
    fetch("/api/supplier")
      .then(r => r.json())
      .then(setSuppliers);
  }, []);

  useEffect(() => {
    if (!supplier?.id) return;
    fetch(`/api/siis?supplier_id=${supplier.id}`, { cache: "no-store" })
      .then(r => r.json())
      .then((data: Row[]) => {
        setRows(data);
        const qs = [...new Set(data.map(r => r.quarter))];
        setSelectedQuarter(qs[0] || "");
      });
  }, [supplier]);

  const quarters = useMemo(
    () => [...new Set(rows.map(r => r.quarter))],
    [rows]
  );

  const filteredRows = useMemo(() => {
    if (!selectedQuarter) return rows;
    return rows.filter(r => r.quarter === selectedQuarter);
  }, [rows, selectedQuarter]);

  const ipds = useMemo(
    () =>
      Array.from(
        new Map(
          filteredRows
            .filter(r => r.ipd && r.ipd !== "-" && r.ipd.trim() !== "")
            .map(r => [
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

  function getMonthPrice(ipdQuotation: string, monthIdx: number) {
    for (const r of filteredRows) {
      const q = r.quarter.split("-")[0];
      if (QUARTER_MONTH_MAP[q]?.includes(monthIdx) &&
          r.ipd_quotation === ipdQuotation) {
        return Number(r.price || 0);
      }
    }
    return 0;
  }

  function formatPrice(v: number) {
    return v === 0 ? "-" : v.toFixed(4);
  }

  /* ================= EXPORT EXCEL ================= */
  function downloadExcel() {
    if (!supplier || !selectedQuarter) return;

    const header = ["IPD", "Material Source", ...MONTHS];
    const body = ipds.map(i => [
      i.ipd,
      i.material_source,
      ...MONTHS.map((_, mIdx) =>
        formatPrice(getMonthPrice(i.ipd_quotation, mIdx))
      ),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SIIS");

    /* ===== APPROVAL EXCEL ===== */
    const startRow = body.length + 4;

    XLSX.utils.sheet_add_aoa(
      ws,
      [
        approvals.map(a => a.title),
        ["", "", ""],
        ["", "", ""],
        approvals.map(a => a.name),
      ],
      { origin: { r: startRow, c: 1 } }
    );

    for (let r = startRow; r <= startRow + 3; r++) {
      for (let c = 1; c <= 3; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        ws[ref] = ws[ref] || { t: "s", v: "" };
        ws[ref].s = {
          alignment: { horizontal: "center" },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };
      }
    }

    XLSX.writeFile(
      wb,
      `SIIS_${supplier.supplier_code}_${selectedQuarter}.xlsx`
    );
  }

  /* ================= EXPORT PDF ================= */
  function downloadPDF() {
    if (!supplier || !selectedQuarter) return;

    const doc = new jsPDF("l", "mm", "a4");

    doc.setFontSize(12);
    doc.text(`SIIS PRICE - ${supplier.supplier_name}`, 14, 10);
    doc.setFontSize(10);
    doc.text(`Quarter: ${selectedQuarter}`, 14, 16);

    autoTable(doc, {
      head: [["IPD", "Material Source", ...MONTHS]],
      body: ipds.map(i => [
        i.ipd,
        i.material_source,
        ...MONTHS.map((_, mIdx) =>
          formatPrice(getMonthPrice(i.ipd_quotation, mIdx))
        ),
      ]),
      startY: 22,
      styles: { fontSize: 8 },
    });

    const pageWidth = doc.internal.pageSize.getWidth();

autoTable(doc, {
  body: [
    approvals.map(a => a.title),
    ["", "", ""],   // area tanda tangan
    ["", "", ""],   // area tanda tangan
    approvals.map(a => a.name),
  ],
  startY: (doc as any).lastAutoTable.finalY + 10,

  // posisi kanan
  margin: { left: pageWidth * 0.55 },
  tableWidth: pageWidth * 0.4,

  theme: "grid",

  styles: {
    halign: "center",
    fontSize: 9,
    cellPadding: 3,
    lineWidth: 0.3,          // ⬅️ pastikan border terlihat
    lineColor: [0, 0, 0],
  },

  didParseCell: function (data) {
    // Baris 1 & 2 = area tanda tangan
    if (data.row.index === 1 || data.row.index === 2) {
      data.cell.styles.minCellHeight = 18; // ⬅️ kotak TTD besar
    }
  },
});



    doc.save(
      `SIIS_${supplier.supplier_code}_${selectedQuarter}.pdf`
    );
  }

  return (
    <div className="p-4 text-xs space-y-4">
      <h1 className="text-2xl font-bold">View Update Price SIIS</h1>

      <select
        className="border px-2 py-1"
        value={supplier?.id || ""}
        onChange={e =>
          setSupplier(
            suppliers.find(s => s.id === e.target.value) || null
          )
        }
      >
        <option value="">-- Select Supplier --</option>
        {suppliers.map(s => (
          <option key={s.id} value={s.id}>
            {s.supplier_code} - {s.supplier_name}
          </option>
        ))}
      </select>

      {/* ===== SUPPLIER DETAIL ===== */}
      {supplier && (
        <div className="border p-3 bg-gray-50 space-y-1">
          <div><strong>SUPPLIER:</strong> {supplier.supplier_name}</div>
          <div><strong>ADDRESS:</strong> {supplier.address}</div>
          <div><strong>CURRENCY:</strong> {supplier.currency}</div>
          <div><strong>INCOTERMS:</strong> {supplier.incoterm}</div>
          <div><strong>TERMS OF PAYMENT:</strong> {supplier.top}</div>

          {selectedQuarter && (
            <div>
              <strong>PRICE VALIDITY:</strong> {selectedQuarter}
            </div>
          )}
        </div>
      )}

      {/* ===== APPROVAL INPUT ===== */}
      <div className="border p-2 bg-gray-50 space-y-2">
        <strong>Approval</strong>
        {approvals.map((a, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="border px-2 py-1 w-1/2"
              value={a.title}
              onChange={e => {
                const copy = [...approvals];
                copy[i].title = e.target.value;
                setApprovals(copy);
              }}
            />
            <input
              className="border px-2 py-1 w-1/2"
              value={a.name}
              onChange={e => {
                const copy = [...approvals];
                copy[i].name = e.target.value;
                setApprovals(copy);
              }}
            />
          </div>
        ))}
      </div>

      {/* ===== TABLE DATA ===== */}
      {supplier && selectedQuarter && (
        <div className="overflow-x-auto border">
          <table className="w-full border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-2">No</th>
                <th className="border px-2">IPD</th>
                <th className="border px-2">Material Source</th>
                {MONTHS.map(m => (
                  <th key={m} className="border px-2">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {ipds.map((i, idx) => (
                <tr key={i.ipd_quotation}>
                  <td className="border px-2 text-center">{idx + 1}</td>
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

      {selectedQuarter && (
        <div className="flex gap-2">
          <button onClick={downloadExcel} className="bg-green-600 text-white px-3 py-1 rounded">
            Download Excel
          </button>
          <button onClick={downloadPDF} className="bg-red-600 text-white px-3 py-1 rounded">
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}
