import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

/* =========================
   GET → list price
========================= */
export async function GET() {
  try {
    await initTables();

    const result = await query(`
      SELECT
        p.id,
        s.supplier_name,
        s.supplier_code,
        p.start_date,
        p.end_date,
        p.price
      FROM price_input p
      JOIN supplier_master s ON s.id = p.supplier_id
      ORDER BY p.start_date DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch price data" },
      { status: 500 }
    );
  }
}

/* =========================
   POST → insert price
========================= */
export async function POST(req: Request) {
  try {
    await initTables();

    const body = await req.json();
    const { supplier_id, start_date, end_date, price } = body;

    if (!supplier_id || !start_date || !price) {
      return NextResponse.json(
        { error: "Supplier, Start Date, dan Price wajib diisi" },
        { status: 400 }
      );
    }

    await query(
      `
      INSERT INTO price_input
      (
        supplier_id,
        start_date,
        end_date,
        price
      )
      VALUES ($1,$2,$3,$4)
      `,
      [supplier_id, start_date, end_date, price]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to insert price" },
      { status: 500 }
    );
  }
}
