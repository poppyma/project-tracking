import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { query } from "@/lib/db";

/* ================================
   CLEAN VALUE
   hapus spasi & tanda kutip
================================ */
function cleanValue(val?: string) {
  if (!val) return "";
  return val.trim().replace(/^"+|"+$/g, "");
}

/* ================================
   FIX CSV BARIS RUSAK
   supplier mengandung koma tanpa quote
================================ */
function fixBrokenCSV(csvText: string, expectedColumns: number) {
  const lines = csvText.split(/\r?\n/);
  if (lines.length <= 1) return csvText;

  const header = lines[0];
  const fixedLines: string[] = [header];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // deteksi delimiter utama
    const delimiter = line.includes(";") ? ";" : ",";

    let parts = line.split(delimiter);

    // kalau kolom kebanyakan (supplier pecah)
    if (parts.length > expectedColumns) {
      /*
        Struktur IPD:
        0 = ipd_siis
        1 = supplier (bisa ada koma)
        2 = fb_type
        3 = commodity
        4 = ipd_quotation
      */
      const ipd_siis = parts[0];
      const tail = parts.slice(parts.length - 3); // fb_type, commodity, ipd_quotation
      const supplierParts = parts.slice(1, parts.length - 3);
      const supplier = supplierParts.join(delimiter);

      parts = [ipd_siis, supplier, ...tail];
    }

    fixedLines.push(parts.join(delimiter));
  }

  return fixedLines.join("\n");
}

/* ================================
   POST : UPLOAD CSV IPD
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
       READ FILE
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
      delimiter: [",", ";"],
      quote: '"',
      relax_quotes: true,
      relax_column_count: true,
      bom: true, // Excel CSV
    }) as any[];

    if (!records.length) {
      return NextResponse.json(
        { message: "File CSV kosong" },
        { status: 400 }
      );
    }

    /* ================================
       INSERT DATA
    ================================ */
    let inserted = 0;

    for (const row of records) {
      const ipd_siis = cleanValue(row.ipd_siis || row["IPD SIIS"]);
      const supplier = cleanValue(row.supplier || row["Supplier"]);
      const fb_type = cleanValue(row.fb_type || row["FB Type"]);
      const commodity = cleanValue(row.commodity || row["Commodity"]);
      const ipd_quotation = cleanValue(
        row.ipd_quotation || row["IPD Quotation"]
      );

      if (!ipd_siis || !fb_type || !commodity) {
        console.warn("SKIP ROW:", row);
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
        [ipd_siis, supplier, fb_type, commodity, ipd_quotation]
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
