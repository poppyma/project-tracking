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
        id,
        ipd_siis,
        supplier,
        "DESC" AS desc,
        fb_type,
        commodity,
        ipd_quotation,
        created_at
      FROM ipd_master
      ORDER BY created_at DESC
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
      supplier_id,
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
      SELECT
        $1,
        s.supplier_name,
        $3,
        $4,
        $5,
        $6
      FROM supplier s
      WHERE s.id = $2
      RETURNING *
      `,
      [
        ipd_siis.trim(),
        supplier_id,
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

