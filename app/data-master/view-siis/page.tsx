"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx-js-style";
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
  desc: string | null;              
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
    { title: "Factory Manager", name: "Mohammad Saadiq" },
    { title: "Finance Controller", name: "Dwi Ana Nursiyani" },
    { title: "Purchasing Manager", name: "Mochrita Lestari" },
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
                desc: r.desc || "-", 
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
    return v === 0 ? "-" : v.toFixed(3);
  }
function downloadExcel() {
  if (!supplier || !selectedQuarter) return;

  /* ================= SUPPLIER INFO ================= */
  const supplierInfo = [
    ["SUPPLIER", supplier.supplier_name],
    ["ADDRESS", supplier.address],
    ["CURRENCY", supplier.currency],
    ["INCOTERMS", supplier.incoterm],
    ["TERMS OF PAYMENT", `${supplier.top} days after BL date`],
    ["PRICE VALIDITY", selectedQuarter],
    [],
  ];

  /* ================= TABLE DATA ================= */
  const header = ["No", "IPD", "DESC", "Material Source", ...MONTHS];

  const body = ipds.map((i, idx) => [
    idx + 1,               // ⬅️ NOMOR
    i.ipd,
    i.desc,
    i.material_source,
    ...MONTHS.map((_, mIdx) =>
      formatPrice(getMonthPrice(i.ipd_quotation, mIdx))
    ),
  ]);

  const startTableRow = supplierInfo.length;

  const ws = XLSX.utils.aoa_to_sheet([
    ...supplierInfo,
    header,
    ...body,
  ]);

  /* ================= AUTO COLUMN WIDTH (REAL AUTOFIT) ================= */
  const allRows = [header, ...body];

  ws["!cols"] = allRows[0].map((_, colIdx) => {
    let maxLength = header[colIdx].toString().length;

    for (const row of allRows) {
      const cell = row[colIdx];
      if (cell !== null && cell !== undefined) {
        maxLength = Math.max(
          maxLength,
          cell.toString().length
        );
      }
    }

    return {
      wch: Math.min(maxLength + 2, 35),
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "SIIS");

  /* ================= STYLE SUPPLIER INFO ================= */
  for (let r = 0; r < supplierInfo.length - 1; r++) {
    ws[XLSX.utils.encode_cell({ r, c: 0 })].s = {
      font: { bold: true },
    };
  }

  /* ================= BORDER + ALIGNMENT TABLE ================= */
  const totalRows = body.length + 1;
  const totalCols = header.length;

  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      const ref = XLSX.utils.encode_cell({
        r: startTableRow + r,
        c,
      });

      ws[ref] = ws[ref] || { t: "s", v: "" };

      ws[ref].s = {
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
        alignment: {
          vertical: "center",
          horizontal:
            c === 0
              ? "center"   // No
              : c <= 2
              ? "left"     // IPD + Material
              : "right",   // Month values
        },
      };

      if (r === 0) {
        ws[ref].s.font = { bold: true };
        ws[ref].s.alignment.horizontal = "center";
      }
    }
  }

  /* ================= APPROVAL ================= */
  const approvalRowStart = startTableRow + body.length + 3;
  const approvalColStart = header.length - approvals.length;

  XLSX.utils.sheet_add_aoa(
    ws,
    [
      approvals.map(a => a.title),
      ["", "", ""],
      approvals.map(a => a.name),
    ],
    { origin: { r: approvalRowStart, c: approvalColStart } }
  );

  for (let r = approvalRowStart; r <= approvalRowStart + 2; r++) {
    for (let c = approvalColStart; c < approvalColStart + approvals.length; c++) {
      ws[XLSX.utils.encode_cell({ r, c })].s = {
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };
    }
  }

  ws["!rows"] = ws["!rows"] || [];
  ws["!rows"][approvalRowStart + 1] = { hpt: 60 };

  XLSX.writeFile(
    wb,
    `SIIS_${supplier.supplier_code}_${selectedQuarter}.xlsx`
  );
}


function downloadPDF() {
  if (!supplier || !selectedQuarter) return;

  const doc = new jsPDF("l", "mm", "a4");
  let y = 12;

  /* ================= TITLE ================= */
  doc.setFontSize(12);
  doc.text(
    `SIIS PRICE - ${supplier.supplier_name}`,
    14,
    y
  );

  y += 6;
  doc.setFontSize(9);

  const info = [
    ["SUPPLIER", supplier.supplier_name],
    ["ADDRESS", supplier.address],
    ["CURRENCY", supplier.currency],
    ["INCOTERMS", supplier.incoterm],
    ["TERMS OF PAYMENT", `${supplier.top} days after BL date`],
    ["PRICE VALIDITY", selectedQuarter],
  ];

  info.forEach(([k, v]) => {
    doc.text(k, 14, y);
    doc.text(`: ${v}`, 50, y);
    y += 5;
  });

  /* ================= TABLE ================= */
  autoTable(doc, {
    startY: y + 4,
    head: [["No", "IPD", "DESC", "Material Source", ...MONTHS]],
    body: ipds.map((i, idx) => [
      idx + 1,
      i.ipd,
      i.desc,
      i.material_source,
      ...MONTHS.map((_, mIdx) =>
        formatPrice(getMonthPrice(i.ipd_quotation, mIdx))
      ),
    ]),
    styles: { fontSize: 8 },
    headStyles: {
      fillColor: [40, 130, 190],
      textColor: 255,
      halign: "center",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
    },
  });

  /* ================= APPROVAL (TTD PANJANG) ================= */
  const pageWidth = doc.internal.pageSize.getWidth();

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 12,
    margin: { left: pageWidth * 0.55 },
    tableWidth: pageWidth * 0.4,
    theme: "grid",

    body: [
      // BARIS TITLE
       approvals.map(a => ({
        content: a.title,
        styles: {
          halign: "center",
          cellPadding: 2,      // ⬅️ kecilkan padding
          fontSize: 9,
        },
      })),

      // BARIS TTD (TINGGI)
      approvals.map(() => ({
        content: "",
        styles: {
          minCellHeight: 20, // ⬅️ INI KUNCINYA
        },
      })),

      // BARIS NAMA
      approvals.map(a => ({
        content: a.name,
        styles: {
          halign: "center",
          cellPadding: 2,      // ⬅️ kecilkan padding
          fontSize: 9,
        },
      })),
    ],

    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: [0, 0, 0], // HITAM
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
                <th className="border px-2">DESC</th> 
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
                  <td className="border px-2">{i.desc}</td> 
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
