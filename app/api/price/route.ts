import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

/* =========================
   GET → list quotation price
   (start & end date TIDAK dikirim ke table UI)
========================= */
export async function GET() {
  try {
    await initTables();

    const result = await query(`
      SELECT
        p.id,
        s.supplier_name,
        s.supplier_code,
        p.ipd_quotation,
        p.ipd_siis,
        p.description,
        p.steel_spec,
        p.material_source,
        p.tube_route,
        p.price
      FROM price_input p
      JOIN supplier_master s ON s.id = p.supplier_id
      ORDER BY p.created_at DESC
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
   POST → insert quotation
========================= */
export async function POST(req: Request) {
  try {
    await initTables();

    const body = await req.json();
    const {
      supplier_id,
      start_date,
      end_date,
      ipd_quotation,
      ipd_siis,
      description,
      steel_spec,
      material_source,
      tube_route,
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
      (
        supplier_id,
        start_date,
        end_date,
        ipd_quotation,
        ipd_siis,
        description,
        steel_spec,
        material_source,
        tube_route,
        price
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `,
      [
        supplier_id,
        start_date,
        end_date,
        ipd_quotation,
        ipd_siis,
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
      { error: "Failed to insert price" },
      { status: 500 }
    );
  }
}
