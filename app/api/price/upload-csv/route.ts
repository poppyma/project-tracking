import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { query } from "@/lib/db";

type PriceCSV = {
  supplier_code: string;
  start_date: string;
  end_date: string;
  quarter: string;
  ipd_siis: string;
  steel_spec: string;
  material_source: string;
  price: string;
};

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

    const buffer = Buffer.from(await file.arrayBuffer());

    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as PriceCSV[];

    if (!records.length) {
      return NextResponse.json(
        { message: "CSV kosong" },
        { status: 400 }
      );
    }

    let inserted = 0;

    for (const row of records) {
      /* =========================
         1. Cari supplier
      ========================= */
      const supplierRes = await query(
        `SELECT id FROM supplier_master WHERE supplier_code = $1`,
        [row.supplier_code]
      );

      if (supplierRes.rowCount === 0) continue;

      const supplier_id = supplierRes.rows[0].id;

      /* =========================
         2. Cari / buat price_header
      ========================= */
      let headerRes = await query(
        `
        SELECT id
        FROM price_header
        WHERE supplier_id = $1
          AND start_date = $2
          AND end_date = $3
        `,
        [supplier_id, row.start_date, row.end_date]
      );

      let header_id: string;

      if (headerRes.rowCount === 0) {
        const insertHeader = await query(
          `
          INSERT INTO price_header (
            supplier_id,
            start_date,
            end_date,
            quarter
          )
          VALUES ($1,$2,$3,$4)
          RETURNING id
          `,
          [
            supplier_id,
            row.start_date,
            row.end_date,
            row.quarter,
          ]
        );

        header_id = insertHeader.rows[0].id;
      } else {
        header_id = headerRes.rows[0].id;
      }

      /* =========================
         3. Insert price_detail
      ========================= */
      const price =
        row.price && !isNaN(Number(row.price))
          ? Number(row.price)
          : null;

      if (!row.ipd_siis) continue;

      await query(
        `
        INSERT INTO price_detail (
          header_id,
          ipd_siis,
          steel_spec,
          material_source,
          price
        )
        VALUES ($1,$2,$3,$4,$5)
        `,
        [
          header_id,
          row.ipd_siis.trim().toUpperCase(),
          row.steel_spec || null,
          row.material_source || null,
          price,
        ]
      );

      inserted++;
    }

    return NextResponse.json({
      success: true,
      message: "Upload price CSV berhasil",
      inserted,
    });
  } catch (error: any) {
    console.error("UPLOAD PRICE CSV ERROR:", error);
    return NextResponse.json(
      {
        message: "Gagal upload CSV price",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}
