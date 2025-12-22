import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(
      `
      SELECT
        s.supplier_code,
        s.supplier_name,
        h.quarter,
        COUNT(d.id) AS total_ipd
      FROM price_header h
      JOIN price_detail d ON d.header_id = h.id
      JOIN supplier_master s ON s.id = h.supplier_id
      GROUP BY
        s.supplier_code,
        s.supplier_name,
        h.quarter
      `
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("TOTAL IPD ERROR:", err);
    return NextResponse.json([], { status: 500 });
  }
}
