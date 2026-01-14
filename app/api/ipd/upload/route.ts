import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { query } from "@/lib/db";

/* ================================
   TYPE CSV IPD
================================ */
type IPDCSV = {
  ipd_siis: string;
  supplier: string;
  fb_type: string;
  commodity: string;
  ipd_quotation: string;
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
       READ FILE
    ================================ */
    const buffer = Buffer.from(await file.arrayBuffer());

    const records = parse(buffer, {
  columns: true,
  skip_empty_lines: true,
  trim: true,

  delimiter: ",",        // 🔒 kunci delimiter
  quote: '"',            // 🔥 support koma di dalam field
  relax_quotes: true,    // aman kalau quote tidak sempurna
  relax_column_count: true, // tidak crash kalau ada row agak rusak
}) as IPDCSV[];

    if (!records.length) {
      return NextResponse.json(
        { message: "File CSV kosong" },
        { status: 400 }
      );
    }

    /* ================================
       INSERT DATA
    ================================ */
    for (const row of records) {
      // basic validation
      if (
        !row.ipd_siis ||
        !row.fb_type ||
        !row.commodity
      ) {
        continue; // skip row invalid
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
            row.ipd_siis,
            row.supplier,
            row.fb_type,
            row.commodity,
            row.ipd_quotation ?? "",
          ]
        );

    }

    return NextResponse.json({
      success: true,
      message: "Upload CSV berhasil",
      total: records.length,
    });
  } catch (error) {
    console.error("UPLOAD CSV ERROR:", error);
    return NextResponse.json(
      { message: "Gagal upload CSV" },
      { status: 500 }
    );
  }
}
