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
        price,
        created_at
      FROM price_master
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
   POST → insert Price
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
      price,
    } = body;

    if (!ipd || price === undefined || price === null) {
      return NextResponse.json(
        { error: "IPD & Price wajib diisi" },
        { status: 400 }
      );
    }

    await query(
      `
      INSERT INTO price_master
      (
        ipd,
        description,
        steel_spec,
        material_source,
        tube_route,
        price
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [
        ipd,
        description,
        steel_spec,
        material_source,
        tube_route,
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
