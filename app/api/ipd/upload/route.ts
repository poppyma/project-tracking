import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { query } from "@/lib/db";

/* ================================
   TYPE CSV IPD
================================ */
type IPDCSV = {
  ipd_siis: string;
  description: string;
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
        !row.description ||
        !row.fb_type ||
        !row.commodity
      ) {
        continue; // skip row invalid
      }

      await query(
        `
        INSERT INTO ipd (
          ipd_siis,
          description,
          fb_type,
          commodity,
          ipd_quotation
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (ipd_siis) DO NOTHING
        `,
        [
          row.ipd_siis,
          row.description,
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
