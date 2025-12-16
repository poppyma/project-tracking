import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");

    if (!projectId) {
      return NextResponse.json([]);
    }

    const res = await query(
      `
      SELECT
        component,
        candidate_supplier,
        price,
        currency,
        term,
        landed_cost,
        tpl,
        bp_2026,
        landed_idr_price,
        cost_bearing
      FROM bom_costs
      WHERE project_id = $1
      ORDER BY component, candidate_supplier
      `,
      [projectId] // STRING → aman untuk int8
    );

    return NextResponse.json(res.rows);
  } catch (err: any) {
    console.error("BOM SUMMARY ERROR:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
