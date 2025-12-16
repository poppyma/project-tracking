import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

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

export async function POST(req: Request) {
  try {
    await initTables();
    const { currency, bp_value } = await req.json();

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
      [currency.trim().toUpperCase(), bp_value.trim()]
    );

    return NextResponse.json(res.rows[0], { status: 201 });

  } catch (err: any) {
    console.error("POST bp error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID required" },
        { status: 400 }
      );
    }

    await query(`DELETE FROM bp_rates WHERE id = $1`, [id]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
