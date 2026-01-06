import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import Papa from "papaparse";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;
    const supplier_code = formData.get("supplier_code") as string;
    const start_date = formData.get("start_date") as string;
    const end_date = formData.get("end_date") as string;
    const quarter = formData.get("quarter") as string;

    if (!file || !supplier_code || !start_date || !end_date) {
      return NextResponse.json(
        { message: "Form upload tidak lengkap" },
        { status: 400 }
      );
    }

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

    // ambil supplier_id
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

    // insert header
    const headerRes = await query(
      `INSERT INTO price_header (supplier_id,start_date,end_date,quarter)
       VALUES ($1,$2,$3,$4)
       RETURNING id`,
      [supplier_id, start_date, end_date, quarter]
    );
    const header_id = headerRes.rows[0].id;

    // insert detail
    for (const r of parsed.data as any[]) {
      await query(
        `INSERT INTO price_detail
         (header_id, ipd_quotation, steel_spec, material_source, price)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          header_id,
          r.ipd_quotation,
          r.steel_spec,
          r.material_source,
          Number(String(r.price).replace(/,/g, "")),
        ]
      );
    }

    return NextResponse.json({
      success: true,
      inserted: parsed.data.length,
    });
  } catch (e) {
    console.error("UPLOAD CSV ERROR:", e);
    return NextResponse.json({ message: "Upload gagal" }, { status: 500 });
  }
}
