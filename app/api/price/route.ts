import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/* =========================
   GET → data price by supplier
========================= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const supplier_id = searchParams.get("supplier_id");

  if (!supplier_id) {
    return NextResponse.json([]);
  }

  const result = await query(
    `
    SELECT
      p.id,
      p.ipd_quotation,
      p.ipd_siis,
      p.description,
      p.steel_spec,
      p.material_source,
      p.tube_route,
      p.price,
      p.quarter,
      p.year,

      s.supplier_code,
      s.supplier_name,
      s.currency,
      s.incoterm,
      s.top
    FROM price_input p
    JOIN supplier_master s ON s.id = p.supplier_id
    WHERE p.supplier_id = $1
    ORDER BY p.created_at DESC
    `,
    [supplier_id]
  );

  return NextResponse.json(result.rows);
}

/* =========================
   POST → insert price
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
      ipd_quotation,
      ipd_siis,
      description,
      steel_spec,
      material_source,
      tube_route,
      price,
    } = body;

    if (!supplier_id || !start_date || !quarter || !year || !price) {
      return NextResponse.json(
        { error: "Data wajib belum lengkap" },
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
        quarter,
        year,
        ipd_quotation,
        ipd_siis,
        description,
        steel_spec,
        material_source,
        tube_route,
        price
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      `,
      [
        supplier_id,
        start_date,
        end_date,
        quarter,
        year,
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
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to save price" },
      { status: 500 }
    );
  }
}
