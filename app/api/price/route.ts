import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
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

    // VALIDATION
    if (
      !supplier_id ||
      !start_date ||
      !end_date ||
      !ipd_quotation ||
      !ipd_siis ||
      !price
    ) {
      return NextResponse.json(
        { error: "Field wajib belum lengkap" },
        { status: 400 }
      );
    }

    await query(
      `
      INSERT INTO price_input (
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
    console.error("POST /api/price error:", error);
    return NextResponse.json(
      { error: "Failed to save price data" },
      { status: 500 }
    );
  }
}
