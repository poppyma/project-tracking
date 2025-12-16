import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    await initTables();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");

    if (!projectId) {
      return NextResponse.json(
        { error: "project_id is required" },
        { status: 400 }
      );
    }

    const res = await query(
      `
      SELECT
        bc.id,
        bc.component,
        bc.candidate_supplier,
        bc.cost_bearing,
        bc.landed_idr_price
      FROM bom_costs bc
      WHERE bc.project_id = $1
      ORDER BY bc.component ASC
      `,
      [projectId]
    );

    return NextResponse.json(res.rows);
  } catch (err: any) {
    console.error("GET bom-summary error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
