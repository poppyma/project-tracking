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
        d.ipd_quotation,
        m.ipd_siis AS ipd,
        d.material_source,
        h.quarter,
        d.price
      FROM price_header h
      JOIN price_detail d
        ON d.header_id = h.id
      LEFT JOIN ipd_master m
        ON m.ipd_quotation = d.ipd_quotation
      WHERE h.supplier_id = $1
        AND m.ipd_siis IS NOT NULL
        AND m.ipd_siis <> ''
        AND m.ipd_siis <> '-'
      ORDER BY m.ipd_siis, h.quarter
      `,
      [supplier_id]
    );


    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("SIIS API ERROR:", err);
    return NextResponse.json([], { status: 500 });
  }
}
