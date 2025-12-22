import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/* =========================
   GET → Price List
========================= */
export async function GET() {
  try {
    const result = await query(`
      SELECT
        p.id,
        p.start_date,
        p.end_date,
        p.quarter,
        p.year,
        p.price,

        s.id AS supplier_id,
        s.supplier_name,
        s.currency,
        s.incoterm,
        s.top

      FROM price_input p
      JOIN supplier_master s ON s.id = p.supplier_id
      ORDER BY p.created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch price data" },
      { status: 500 }
    );
  }
}

/* =========================
   POST → Input Price
========================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      supplier_id,
      start_date,
      end_date,
      quarter,
      year,
      price,
    } = body;

    if (!supplier_id || !start_date || !price) {
      return NextResponse.json(
        { error: "Supplier, Start Date, dan Price wajib diisi" },
        { status: 400 }
      );
    }

    await query(
      `
      INSERT INTO price_input
        (supplier_id, start_date, end_date, quarter, year, price)
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [supplier_id, start_date, end_date, quarter, year, price]
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Failed to insert price" },
      { status: 500 }
    );
  }
}
