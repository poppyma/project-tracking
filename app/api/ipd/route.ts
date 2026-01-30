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
      supplier_id, // ⬅️ UUID dari frontend
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

    // 🔥 Ambil NAMA supplier dari supplier_master
    const supplierRes = await query(
      `SELECT supplier_name FROM supplier_master WHERE id = $1`,
      [supplier_id]
    );

    if (supplierRes.rowCount === 0) {
      return NextResponse.json(
        { error: "Supplier tidak ditemukan" },
        { status: 400 }
      );
    }

    const supplier_name = supplierRes.rows[0].supplier_name;

    // 🔥 Simpan NAMA supplier ke ipd_master
    const result = await query(
      `
      INSERT INTO ipd_master
        (ipd_siis, supplier, "DESC", fb_type, commodity, ipd_quotation)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        ipd_siis.trim(),
        supplier_name,
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
