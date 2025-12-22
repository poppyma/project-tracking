import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

/* =========================
   GET → ambil data Price
========================= */
export async function GET() {
  try {
    await initTables();

    const result = await query(`
      SELECT
        id,
        ipd,
        description,
        steel_spec,
        material_source,
        tube_route,
        supplier_code,
        currency,
        incoterm,
        top,
        start_date,
        end_date,
        price,
        created_at
      FROM update_price
      ORDER BY created_at DESC
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
   POST → simpan Price
========================= */
export async function POST(req: Request) {
  try {
    await initTables();

    const body = await req.json();
    const {
      ipd,
      description,
      steel_spec,
      material_source,
      tube_route,
      supplier_code,
      currency,
      incoterm,
      top,
      start_date,
      end_date,
      price,
    } = body;

    if (!ipd || !supplier_code || !price || !start_date) {
      return NextResponse.json(
        { error: "IPD, Supplier, Start Date, dan Price wajib diisi" },
        { status: 400 }
      );
    }

    await query(
      `
      INSERT INTO update_price
      (
        ipd,
        description,
        steel_spec,
        material_source,
        tube_route,
        supplier_code,
        currency,
        incoterm,
        top,
        start_date,
        end_date,
        price
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      `,
      [
        ipd,
        description,
        steel_spec,
        material_source,
        tube_route,
        supplier_code,
        currency,
        incoterm,
        top,
        start_date,
        end_date,
        price,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to insert price data" },
      { status: 500 }
    );
  }
}
