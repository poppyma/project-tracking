import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

// GET → ambil semua BP
export async function GET() {
  try {
    await initTables();
    const res = await query(
      `SELECT * FROM bp_rates ORDER BY created_at DESC`
    );
    return NextResponse.json(res.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST → tambah BP
export async function POST(req: Request) {
  try {
    await initTables();
    const { currency, bp_value } = await req.json();

    if (!currency || !bp_value) {
      return NextResponse.json(
        { error: "Currency & BP value required" },
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
