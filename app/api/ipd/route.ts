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
        description,
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
   POST → tambah IPD
========================= */
export async function POST(req: Request) {
  try {
    await initTables();

    const {
      ipd_siis,
      description,
      fb_type,
      commodity,
      ipd_quotation,
    } = await req.json();

    if (!ipd_siis) {
      return NextResponse.json(
        { error: "IPD SIIS is required" },
        { status: 400 }
      );
    }

    await query(
      `
      INSERT INTO ipd_master
      (ipd_siis, description, fb_type, commodity, ipd_quotation)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [ipd_siis, description, fb_type, commodity, ipd_quotation]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to insert IPD data" },
      { status: 500 }
    );
  }
}
