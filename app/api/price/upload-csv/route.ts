import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import Papa from "papaparse";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const supplier_code = formData.get("supplier_code") as string | null;
    const start_date = formData.get("start_date") as string | null;
    const end_date = formData.get("end_date") as string | null;
    const quarter = formData.get("quarter") as string | null;

    if (!file || !supplier_code || !start_date || !end_date || !quarter) {
      return NextResponse.json(
        { message: "Form upload tidak lengkap" },
        { status: 400 }
      );
    }

    /* =========================
       PARSE CSV
    ========================= */
    const csvText = await file.text();
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length) {
      return NextResponse.json(
        { message: "CSV format error" },
        { status: 400 }
      );
    }

    /* =========================
       AMBIL SUPPLIER
    ========================= */
    const supplierRes = await query(
      `SELECT id FROM supplier_master WHERE supplier_code = $1`,
      [supplier_code]
    );

    const supplier_id = supplierRes.rows[0]?.id;
    if (!supplier_id) {
      return NextResponse.json(
        { message: "Supplier tidak ditemukan" },
        { status: 400 }
      );
    }

    /* =========================
       INSERT HEADER
    ========================= */
    const headerRes = await query(
      `
      INSERT INTO price_header
        (supplier_id, start_date, end_date, quarter)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [supplier_id, start_date, end_date, quarter]
    );

    const header_id = headerRes.rows[0].id;

    /* =========================
       INSERT DETAIL
       (TANPA description)
    ========================= */
    let inserted = 0;

    for (const r of parsed.data as any[]) {
      if (!r.ipd_quotation || !r.price) continue;

      await query(
        `
        INSERT INTO price_detail
          (header_id, ipd_quotation, steel_spec, material_source, price)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          header_id,
          r.ipd_quotation,
          r.steel_spec || null,
          r.material_source || null,
          Number(String(r.price).replace(/,/g, "")),
        ]
      );

      inserted++;
    }

    return NextResponse.json({
      success: true,
      inserted,
    });
  } catch (e) {
    console.error("UPLOAD CSV ERROR:", e);
    return NextResponse.json(
      { message: "Upload gagal" },
      { status: 500 }
    );
  }
}
