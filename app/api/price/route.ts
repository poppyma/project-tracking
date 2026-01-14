import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/* ================= GET VIEW PRICE ================= */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const supplier_id = searchParams.get("supplier_id");
    const quarter = searchParams.get("quarter");
    const listQuarter = searchParams.get("list_quarter");

    if (!supplier_id) return NextResponse.json([]);

    /* ===== LIST QUARTER ===== */
    if (listQuarter === "true") {
      const qRes = await query(
        `SELECT DISTINCT quarter
         FROM price_header
         WHERE supplier_id = $1
         ORDER BY quarter`,
        [supplier_id]
      );

      return NextResponse.json(qRes.rows.map((r) => r.quarter));
    }

    /* ===== VIEW PRICE ===== */
    const sql = `
      SELECT
        h.id AS header_id,
        h.start_date,
        h.end_date,
        h.quarter,

        d.id AS detail_id,
        d.ipd_quotation,

        m.ipd_siis,

        d.steel_spec,
        d.material_source,
        d.price
      FROM price_header h
      JOIN price_detail d
        ON d.header_id = h.id

      JOIN supplier_master s
        ON s.id = h.supplier_id

      LEFT JOIN ipd_master m
        ON m.ipd_quotation = d.ipd_quotation
      AND UPPER(m.supplier) = UPPER(s.supplier_name)

      WHERE h.supplier_id = $1
      ${quarter ? "AND h.quarter = $2" : ""}

      ORDER BY h.start_date DESC, m.ipd_siis;

    `;

    const params = quarter ? [supplier_id, quarter] : [supplier_id];
    const res = await query(sql, params);

    const rows = res.rows.map((r) => ({
      ...r,
      start_date: r.start_date?.toISOString().split("T")[0],
      end_date: r.end_date?.toISOString().split("T")[0],
    }));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET VIEW PRICE ERROR:", err);
    return NextResponse.json([], { status: 500 });
  }
}
