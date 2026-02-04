import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import Papa from "papaparse";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const supplier_id = formData.get("supplier_id") as string | null;
    const start_date = formData.get("start_date") as string | null;
    const end_date = formData.get("end_date") as string | null;
    const quarter = formData.get("quarter") as string | null;

    /* =========================
       VALIDATION
    ========================= */
    if (!file || !supplier_id || !start_date || !end_date || !quarter) {
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

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { message: "CSV format error" },
        { status: 400 }
      );
    }

    /* =========================
       INSERT PRICE HEADER
    ========================= */
    const headerRes = await query(`
  INSERT INTO price_header
    (supplier_id, start_date, end_date, quarter)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (supplier_id, quarter)
  DO UPDATE SET
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date
  RETURNING id
`, [supplier_id, start_date, end_date, quarter]);


    const header_id = headerRes.rows[0].id;

    /* =========================
       INSERT PRICE DETAIL
    ========================= */
    let inserted = 0;

    for (const r of parsed.data as any[]) {
      if (!r.ipd_quotation || !r.price) continue;

      await query(`
  INSERT INTO price_detail
    (header_id, ipd_quotation, steel_spec, material_source, price)
  VALUES ($1, $2, $3, $4, $5)
  ON CONFLICT (header_id, ipd_quotation, material_source)
  DO UPDATE SET
    steel_spec = EXCLUDED.steel_spec,
    price = EXCLUDED.price
`);


      inserted++;
    }

    /* =========================
       RESPONSE
    ========================= */
    return NextResponse.json({
      success: true,
      inserted,
    });
  } catch (error) {
    console.error("UPLOAD CSV ERROR:", error);
    return NextResponse.json(
      { message: "Upload gagal" },
      { status: 500 }
    );
  }
}
