import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

/* ============================
   GET → Ambil semua BP
============================ */
export async function GET() {
  try {
    await initTables();

    const res = await query(`
      SELECT id, currency, bp_value
      FROM bp_rates
      ORDER BY currency ASC
    `);

    return NextResponse.json(res.rows);
  } catch (err: any) {
    console.error("GET bp error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ============================
   POST → Tambah BP
============================ */
export async function POST(req: Request) {
  try {
    await initTables();
    const body = await req.json();

    const { currency, bp_value } = body;

    if (!currency || !bp_value) {
      return NextResponse.json(
        { error: "Currency & BP wajib diisi" },
        { status: 400 }
      );
    }

    const res = await query(
      `
      INSERT INTO bp_rates (currency, bp_value)
      VALUES ($1,$2)
      RETURNING *
      `,
      [currency.toUpperCase(), bp_value]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (err: any) {
    console.error("POST bp error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
