import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

/* =========================
   GET → ambil semua IPD
========================= */
export async function GET() {
  try {
    await initTables();

    const result = await query(`
      SELECT
        im.id,
        im.ipd_siis,
        s.supplier_name AS supplier,
        im."DESC" AS desc,
        im.fb_type,
        im.commodity,
        im.ipd_quotation,
        im.created_at
      FROM ipd_master im
      LEFT JOIN supplier s
        ON im.supplier = s.id
      ORDER BY im.created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch IPD data" },
      { status: 500 }
    );
  }
}


/* =========================
   POST → tambah IPD (MANUAL)
========================= */
export async function POST(req: Request) {
  try {
    await initTables();

    const {
      ipd_siis,
      supplier_id, // isinya NAMA supplier
      desc,
      fb_type,
      commodity,
      ipd_quotation,
    } = await req.json();

    if (!ipd_siis || !supplier_id) {
      return NextResponse.json(
        { error: "IPD SIIS dan Supplier wajib diisi" },
        { status: 400 }
      );
    }

    const result = await query(
      `
      INSERT INTO ipd_master
        (ipd_siis, supplier, "DESC", fb_type, commodity, ipd_quotation)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        ipd_siis.trim(),
        supplier_id.trim(), // langsung simpan text supplier
        desc || null,
        fb_type || null,
        commodity || null,
        ipd_quotation || null,
      ]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("POST IPD ERROR:", error);
    return NextResponse.json(
      { error: "Failed to insert IPD data" },
      { status: 500 }
    );
  }
}
