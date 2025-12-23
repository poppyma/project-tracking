import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const supplier_id = searchParams.get("supplier_id");

    if (!supplier_id) {
      return NextResponse.json(
        { error: "supplier_id required" },
        { status: 400 }
      );
    }

    const result = await query(
      `
      SELECT
        p.ipd_siis AS ipd,
        p.description,
        p.material_source,
        p.quarter,
        p.price
      FROM price_input p
      WHERE p.supplier_id = $1
      ORDER BY p.ipd_siis, p.quarter
      `,
      [supplier_id]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("PRICE QUARTERS ERROR:", err);
    return NextResponse.json([], { status: 500 });
  }
}
