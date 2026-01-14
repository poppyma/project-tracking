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
       READ & PARSE CSV
    ================================ */
    const buffer = Buffer.from(await file.arrayBuffer());

    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,

      delimiter: ",",          // kunci delimiter
      quote: '"',              // support koma di dalam field
      relax_quotes: true,
      relax_column_count: true,
      bom: true,               // PENTING untuk CSV Excel
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

      // basic validation
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
