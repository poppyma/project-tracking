import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

export async function GET() {
  await initTables();
  const res = await query(`SELECT * FROM bp_rates ORDER BY currency`);
  return NextResponse.json(res.rows);
}

export async function POST(req: Request) {
  await initTables();
  const { currency, bp_value } = await req.json();

  const res = await query(
    `INSERT INTO bp_rates (currency, bp_value)
     VALUES ($1,$2)
     RETURNING *`,
    [currency, bp_value]
  );

  return NextResponse.json(res.rows[0], { status: 201 });
}
