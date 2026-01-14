import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { query } from "@/lib/db";

/* ================================
   TYPE CSV IPD
================================ */
type IPDCSV = {
  ipd_siis?: string;
  supplier?: string;
  fb_type?: string;
  commodity?: string;
  ipd_quotation?: string;
};

/* ================================
   FIX CSV YANG RUSAK KARENA KOMA
   (supplier tanpa quote)
================================ */
function fixBrokenCSV(csvText: string, expectedColumns: number) {
  const lines = csvText.split(/\r?\n/);
  if (lines.length <= 1) return csvText;

  const header = lines[0];
  const fixedLines: string[] = [header];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // split pakai koma dulu
    let parts = line.split(",");

    // kalau kolom lebih banyak dari seharusnya
    if (parts.length > expectedColumns) {
      /*
        Format IPD:
        0 = ipd_siis
        1 = supplier (BISA ADA KOMA)
        2 = fb_type
        3 = commodity
        4 = ipd_quotation
      */

      const ipd_siis = parts[0];

      // ambil kolom belakang (fb_type, commodity, ipd_quotation)
      const tail = parts.slice(parts.length - 3);

      // gabungkan semua yang di tengah jadi supplier
      const supplierParts = parts.slice(1, parts.length - 3);
      const supplier = supplierParts.join(",");

      parts = [ipd_siis, supplier, ...tail];
    }

    fixedLines.push(parts.join(","));
  }

  return fixedLines.join("\n");
}

/* ================================
   POST : UPLOAD CSV
================================ */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { message: "Format file harus .csv" },
        { status: 400 }
      );
    }

    /* ================================
       READ FILE AS TEXT
    ================================ */
    const rawText = Buffer.from(await file.arrayBuffer()).toString("utf-8");

    // IPD CSV punya 5 kolom
    const fixedText = fixBrokenCSV(rawText, 5);

    /* ================================
       PARSE CSV
    ================================ */
    const records = parse(fixedText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,

      delimiter: [",", ";"], // support CSV Indonesia / EU
      quote: '"',
      relax_quotes: true,
      relax_column_count: true,
      bom: true, // CSV Excel
    }) as any[];

    if (!records.length) {
      return NextResponse.json(
        { message: "File CSV kosong" },
        { status: 400 }
      );
    }

    /* ================================
       NORMALIZE HEADER
    ================================ */
    function normalize(row: any): IPDCSV {
      return {
        ipd_siis:
          row.ipd_siis ||
          row["IPD SIIS"] ||
          row["ipd siis"],

        supplier:
          row.supplier ||
          row["Supplier"],

        fb_type:
          row.fb_type ||
          row["FB Type"] ||
          row["fb_type"],

        commodity:
          row.commodity ||
          row["Commodity"],

        ipd_quotation:
          row.ipd_quotation ||
          row["IPD Quotation"],
      };
    }

    /* ================================
       INSERT DATA
    ================================ */
    let inserted = 0;

    for (const raw of records) {
      const row = normalize(raw);

      if (!row.ipd_siis || !row.fb_type || !row.commodity) {
        console.warn("SKIP ROW:", raw);
        continue;
      }

      await query(
        `
        INSERT INTO ipd_master (
          ipd_siis,
          supplier,
          fb_type,
          commodity,
          ipd_quotation
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          row.ipd_siis.trim(),
          row.supplier?.trim() ?? "",
          row.fb_type.trim(),
          row.commodity.trim(),
          row.ipd_quotation?.trim() ?? "",
        ]
      );

      inserted++;
    }

    return NextResponse.json({
      success: true,
      message: "Upload CSV berhasil",
      total: records.length,
      inserted,
    });
  } catch (error) {
    console.error("UPLOAD CSV ERROR:", error);
    return NextResponse.json(
      { message: "Gagal upload CSV" },
      { status: 500 }
    );
  }
}
