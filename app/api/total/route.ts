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
        COALESCE(COUNT(d.id), 0) AS total_ipd
      FROM supplier_master s
      LEFT JOIN price_header h
        ON h.supplier_id = s.id
      LEFT JOIN price_detail d
        ON d.header_id = h.id
      GROUP BY
        s.supplier_code,
        s.supplier_name,
        h.quarter
      ORDER BY
        s.supplier_code,
        h.quarter
      `
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("TOTAL IPD ERROR:", err);
    return NextResponse.json([], { status: 500 });
  }
}
