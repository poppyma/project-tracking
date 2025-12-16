import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    await initTables();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");

    if (!projectId) {
      return NextResponse.json(
        { error: "project_id required" },
        { status: 400 }
      );
    }

    const res = await query(
      `
      SELECT
        bc.id,
        bc.component,
        bc.candidate_supplier,
        bc.price,
        bc.currency,
        bc.term,
        bc.landed_cost,
        bc.tpl,
        bc.bp_2026,
        bc.landed_idr_price,
        bc.cost_bearing
      FROM bom_costs bc
      WHERE bc.project_id = $1
      ORDER BY bc.component, bc.cost_bearing::numeric ASC
      `,
      [projectId]
    );

    return NextResponse.json(res.rows);
  } catch (err: any) {
    console.error("GET bom summary error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
