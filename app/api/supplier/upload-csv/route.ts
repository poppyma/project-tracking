import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { query } from "@/lib/db";

/* ================================
   TYPE CSV SUPPLIER
================================ */
type SupplierCSV = {
  supplier_code?: string;
  supplier_name?: string;
  address?: string;
  country?: string;
  pic?: string;
  email?: string;
  category?: string;
  currency?: string;
  incoterm?: string;
  top?: string;
  forwarder?: string;
};

/* ================================
   POST : UPLOAD CSV SUPPLIER
================================ */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    /* ================================
       VALIDASI FILE
    ================================ */
    if (!file) {
      return NextResponse.json(
        { message: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
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
      delimiter: [",", ";"],          // 🔥 FIX Excel Indonesia
      relax_column_count: true,       // 🔥 Toleransi kolom
      bom: true,                      // 🔥 Hilangkan UTF-8 BOM
    }) as SupplierCSV[];

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
    let skipped = 0;

    for (const row of records) {
      // VALIDASI WAJIB
      if (!row.supplier_code || !row.supplier_name) {
        skipped++;
        continue;
      }

      /* ================================
         SAFE PARSE TOP (INTEGER)
      ================================ */
      let topValue: number | null = null;
      if (row.top !== undefined && row.top !== null && row.top !== "") {
        const parsed = Number(
          String(row.top).replace(/[^0-9]/g, "")
        );
        if (!Number.isNaN(parsed)) {
          topValue = parsed;
        }
      }

      await query(
        `
        INSERT INTO supplier_master (
          supplier_code,
          supplier_name,
          address,
          country,
          pic,
          email,
          category,
          currency,
          incoterm,
          top,
          forwarder
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
        )
        `,
        [
          row.supplier_code,
          row.supplier_name,
          row.address ?? null,
          row.country ?? null,
          row.pic ?? null,
          row.email ?? null,
          row.category ?? null,
          row.currency ?? null,
          row.incoterm ?? null,
          topValue,               // ✅ TIDAK PERNAH NaN
          row.forwarder ?? null,
        ]
      );

      inserted++;
    }

    return NextResponse.json({
      success: true,
      message: "Upload CSV supplier berhasil",
      total_rows: records.length,
      inserted_rows: inserted,
      skipped_rows: skipped,
    });
  } catch (error: any) {
    console.error("UPLOAD SUPPLIER CSV ERROR:", error);
    return NextResponse.json(
      { message: "Gagal upload CSV", detail: error.message },
      { status: 500 }
    );
  }
}
